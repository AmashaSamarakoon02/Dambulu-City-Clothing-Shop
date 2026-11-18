/**
 * npm run test:allure
 * Runs the Playwright suite, masks credentials in allure-results/, then builds allure-report/.
 * Exits with the Playwright exit code, so a failing suite still fails the command.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const run = (cmd) => spawnSync(cmd, { cwd: root, stdio: 'inherit', shell: true }).status ?? 1;

fs.rmSync(path.join(root, 'allure-results'), { recursive: true, force: true });

const testStatus = run(`npx playwright test ${process.argv.slice(2).join(' ')}`);
run('node scripts/redact-allure-results.mjs');
const reportStatus = run('npx allure generate allure-results');

process.exit(testStatus || reportStatus);
