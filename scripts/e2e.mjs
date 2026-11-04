// Runs the browser tests, then builds the test dashboard, and exits with the tests' result.
import { spawnSync } from 'node:child_process';
const pw = spawnSync('npx', ['playwright', 'test', ...process.argv.slice(2)], { stdio: 'inherit', shell: process.platform === 'win32' });
const rep = spawnSync(process.execPath, ['scripts/report.mjs'], { stdio: 'inherit' });
if (rep.status !== 0) console.error('The test report could not be built (the test results are unaffected).');
process.exit(pw.status ?? 1);
