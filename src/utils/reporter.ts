import * as fs from 'fs';
import * as path from 'path';

export interface FailureRecord {
  testName: string;
  timestamp: string;
  step: string;
  errorMessage: string;
  screenshotPath?: string;
  url?: string;
}

const REPORT_DIR = path.join(process.cwd(), 'reports', 'failures');

function ensureReportDir(): void {
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }
}

export function logFailure(record: FailureRecord): void {
  ensureReportDir();
  const filename = `failure-${Date.now()}.json`;
  const filepath = path.join(REPORT_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(record, null, 2), 'utf8');
  console.error(`[reporter] Failure logged: ${filepath}`);
}
