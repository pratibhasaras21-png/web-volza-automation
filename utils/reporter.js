const fs = require('fs');
const path = require('path');

const REPORT_DIR = path.join(process.cwd(), 'reports', 'failures');

function ensureReportDir() {
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }
}

function logFailure(record) {
  ensureReportDir();
  const filename = `failure-${Date.now()}.json`;
  const filepath = path.join(REPORT_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(record, null, 2), 'utf8');
  console.error(`[reporter] Failure logged: ${filepath}`);
}

module.exports = { logFailure };
