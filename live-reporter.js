// @ts-nocheck
// Streams live progress to qa-test-dashboard/public/live-run.json as tests
// run, so the QA dashboard (localhost:5173) can poll it and show real-time
// status instead of only a post-run summary.
const fs = require('fs');
const path = require('path');

// eslint-disable-next-line no-control-regex
const ANSI_PATTERN = /\x1b\[[0-9;]*m/g;
function stripAnsi(str) {
  return str.replace(ANSI_PATTERN, '');
}

const OUTPUT_PATH = path.join(__dirname, '..', 'qa-test-dashboard', 'public', 'live-run.json');

const STATUS_MAP = {
  passed: 'Passed',
  failed: 'Failed',
  timedOut: 'Failed',
  interrupted: 'Failed',
  skipped: 'Skipped',
};

class LiveReporter {
  constructor() {
    this.tests = [];
    this.startedAt = null;
  }

  write(extra) {
    const passed = this.tests.filter((t) => t.status === 'Passed').length;
    const failed = this.tests.filter((t) => t.status === 'Failed').length;
    const skipped = this.tests.filter((t) => t.status === 'Skipped').length;

    const payload = {
      status: 'running',
      startedAt: this.startedAt,
      updatedAt: new Date().toISOString(),
      totalPlanned: this.totalPlanned || this.tests.length,
      completed: this.tests.length,
      passed,
      failed,
      skipped,
      tests: this.tests,
      ...extra,
    };

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2));
  }

  onBegin(config, suite) {
    this.startedAt = new Date().toISOString();
    this.totalPlanned = suite.allTests().length;
    this.write();
  }

  onTestEnd(test, result) {
    // Only keep the final attempt for a given test (retries overwrite in place).
    const module = test.parent?.title || path.basename(test.location.file);
    const key = `${test.location.file}:${test.location.line}`;
    const record = {
      key,
      module,
      title: test.title,
      file: path.relative(path.join(__dirname), test.location.file).replace(/\\/g, '/'),
      status: STATUS_MAP[result.status] || 'Failed',
      durationSeconds: Math.round(result.duration / 1000),
      retry: result.retry,
      date: new Date().toISOString().slice(0, 10),
      error: result.error?.message ? stripAnsi(result.error.message.split('\n')[0]).trim().slice(0, 200) : undefined,
    };

    const existingIndex = this.tests.findIndex((t) => t.key === key);
    if (existingIndex >= 0) this.tests[existingIndex] = record;
    else this.tests.push(record);

    this.write();
  }

  onEnd(result) {
    this.write({ status: 'completed', finishedAt: new Date().toISOString(), overallStatus: result.status });
  }
}

module.exports = LiveReporter;
