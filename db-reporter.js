// @ts-nocheck
// Persists finalized run/test/step/log/screenshot data into the shared SQLite dashboard
// DB, so qa-test-dashboard can show real, accumulating history instead of a mock
// dataset. Runs alongside (not instead of) live-reporter.js - that one still drives the
// in-progress LiveRunPanel via live-run.json; this one is purely for durable storage.
//
// Requires the shared db/connection.js by relative cross-project path rather than
// duplicating the DB layer - Node resolves that file's own dependencies (currently
// none; it uses the built-in node:sqlite) relative to its own location, not the
// caller's, so this works without installing anything extra here.
const os = require('os');
const path = require('path');
const fs = require('fs');
const { getDb, cleanupOldRuns } = require('../qa-test-dashboard/server/db/connection.js');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'qa-test-dashboard', 'server', 'db', 'screenshots');

// Same ANSI-stripping pattern already used in live-reporter.js - Playwright colors its
// error/step output for terminal display, but those escape codes render as garbled
// literal text in the dashboard's browser UI, so strip them before storing anything.
// eslint-disable-next-line no-control-regex
const ANSI_PATTERN = /\x1b\[[0-9;]*m/g;
function stripAnsi(str) {
  return typeof str === 'string' ? str.replace(ANSI_PATTERN, '') : str;
}

// Test titles in this suite are conventionally prefixed "TC-16 to TC-22: ..." or
// "TC-43: ...", used elsewhere in the specs' own console.log() calls - extract that as
// a separate label so the dashboard can show it distinctly from the descriptive title.
function extractTestCaseLabel(title) {
  const match = title.match(/^(TC-[\w.]+(?:\s+to\s+TC-[\w.]+)?)\s*:\s*(.*)$/i);
  return match ? { label: match[1], name: match[2] } : { label: null, name: title };
}

// Flattens the top-level steps Playwright's own action log already records (clicks,
// fills, navigations, expects) - deliberately NOT recursing into each step's nested
// sub-steps, and skipping 'hook'/'fixture' noise, so the result reads as a reasonably
// clean action-by-action list without needing any test.step() changes in the specs.
function extractSteps(steps) {
  if (!steps) return [];
  return steps
    .filter(s => s.category === 'pw:api' || s.category === 'expect')
    .map((s, i) => ({
      stepNumber: i + 1,
      description: s.title,
      category: s.category,
      status: s.error ? 'failed' : 'passed',
      durationMs: Math.round(s.duration || 0),
      errorMessage: s.error?.message ? stripAnsi(String(s.error.message).split('\n')[0]).slice(0, 300) : null,
    }));
}

function findFailedStep(steps) {
  const failed = (steps || []).find(s => s.error);
  return failed ? failed.title : null;
}

function extractLogLines(entries) {
  if (!entries) return [];
  const lines = [];
  for (const entry of entries) {
    // At runtime each entry is typically a plain string; TestResultStdio's {text,
    // buffer} shape only shows up for genuinely binary writes, so handle both.
    const text = typeof entry === 'string' ? entry : (entry.text ?? (entry.buffer ? entry.buffer.toString('utf8') : ''));
    for (const line of stripAnsi(text).split('\n')) {
      const trimmed = line.trim();
      if (trimmed) lines.push(trimmed);
    }
  }
  return lines;
}

class DbReporter {
  constructor() {
    this.db = null;
    this.runId = null;
    this.totals = { total: 0, passed: 0, failed: 0, skipped: 0 };
    this.startedAt = null;
  }

  onBegin(config, suite) {
    this.db = getDb();
    this.startedAt = new Date();
    this.totals.total = suite.allTests().length;

    const project = config.projects?.[0];
    const browser = (config.projects || []).map(p => p.name).join(', ') || project?.name || null;
    const baseUrl = project?.use?.baseURL || null;
    const executedBy = os.userInfo().username;
    // Same env var / fallback convention already used in global-setup.js and
    // src/helpers/auth.js for the Volza company/plan being tested.
    this.environment = process.env.VOLZA_COMPANY || 'SME Biyearly plan';

    const info = this.db
      .prepare(
        `INSERT INTO test_runs (started_at, environment, browser, base_url, executed_by, triggered_by, total)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(this.startedAt.toISOString(), this.environment, browser, baseUrl, executedBy, 'manual', this.totals.total);

    this.runId = info.lastInsertRowid;
  }

  getOrCreateModule(name) {
    this.db.prepare('INSERT OR IGNORE INTO modules (name) VALUES (?)').run(name);
    return this.db.prepare('SELECT id FROM modules WHERE name = ?').get(name).id;
  }

  onTestEnd(test, result) {
    if (!this.db) return;

    const status = result.status === 'timedOut' || result.status === 'interrupted' ? 'failed' : result.status;
    if (status === 'passed') this.totals.passed++;
    else if (status === 'failed') this.totals.failed++;
    else if (status === 'skipped') this.totals.skipped++;

    const moduleName = test.parent?.title || path.basename(test.location.file);
    const moduleId = this.getOrCreateModule(moduleName);
    const { label, name } = extractTestCaseLabel(test.title);
    const steps = extractSteps(result.steps);
    const startTime = result.startTime instanceof Date ? result.startTime : new Date(result.startTime);
    const endTime = new Date(startTime.getTime() + (result.duration || 0));

    const testInfo = this.db
      .prepare(
        `INSERT INTO test_cases
           (run_id, module_id, test_case_label, name, status, start_time, end_time, duration_ms,
            browser, environment, executed_by, retry_count, error_type, error_message, error_stack, failed_step)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        this.runId,
        moduleId,
        label,
        name,
        status,
        startTime.toISOString(),
        endTime.toISOString(),
        Math.round(result.duration || 0),
        test.parent?.project()?.name || null,
        this.environment,
        os.userInfo().username,
        result.retry || 0,
        result.error ? (result.error.name || 'Error') : null,
        result.error?.message ? stripAnsi(String(result.error.message)).slice(0, 2000) : null,
        result.error?.stack ? stripAnsi(String(result.error.stack)).slice(0, 8000) : null,
        findFailedStep(result.steps)
      );

    const testCaseId = testInfo.lastInsertRowid;

    const insertStep = this.db.prepare(
      `INSERT INTO test_steps (test_case_id, step_number, description, category, status, duration_ms, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const step of steps) {
      insertStep.run(testCaseId, step.stepNumber, step.description, step.category, step.status, step.durationMs, step.errorMessage);
    }

    const insertLog = this.db.prepare(
      `INSERT INTO execution_logs (test_case_id, timestamp, level, message) VALUES (?, ?, ?, ?)`
    );
    for (const line of extractLogLines(result.stdout)) {
      insertLog.run(testCaseId, new Date().toISOString(), 'log', line.slice(0, 1000));
    }
    for (const line of extractLogLines(result.stderr)) {
      insertLog.run(testCaseId, new Date().toISOString(), 'error', line.slice(0, 1000));
    }

    const imageAttachments = (result.attachments || []).filter(a => a.contentType?.startsWith('image/') && a.path);
    if (imageAttachments.length > 0) {
      const runDir = path.join(SCREENSHOTS_DIR, String(this.runId));
      fs.mkdirSync(runDir, { recursive: true });
      const insertScreenshot = this.db.prepare(
        `INSERT INTO screenshots (test_case_id, path, label) VALUES (?, ?, ?)`
      );
      imageAttachments.forEach((att, i) => {
        const destName = `${testCaseId}-${i + 1}${path.extname(att.path) || '.png'}`;
        const destPath = path.join(runDir, destName);
        try {
          fs.copyFileSync(att.path, destPath);
          insertScreenshot.run(testCaseId, destPath, att.name || null);
        } catch {
          // Source screenshot may already be cleaned up by Playwright - skip silently.
        }
      });
    }
  }

  onEnd(result) {
    if (!this.db || !this.runId) return;
    const endedAt = new Date();
    const durationMs = endedAt.getTime() - this.startedAt.getTime();

    this.db
      .prepare(
        `UPDATE test_runs SET ended_at = ?, total = ?, passed = ?, failed = ?, skipped = ?, duration_ms = ?, overall_status = ?
         WHERE id = ?`
      )
      .run(
        endedAt.toISOString(),
        this.totals.total,
        this.totals.passed,
        this.totals.failed,
        this.totals.skipped,
        durationMs,
        result.status,
        this.runId
      );

    const deleted = cleanupOldRuns(15);
    if (deleted > 0) console.log(`[db-reporter] Cleaned up ${deleted} run(s) older than 15 days`);
  }
}

module.exports = DbReporter;
