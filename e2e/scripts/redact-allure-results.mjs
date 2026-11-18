/**
 * Removes credentials from allure-results/ before the report is generated.
 *
 * Playwright step titles include typed values (e.g. `Fill "<password>"`), so without this
 * the TEST_USER password and email would appear in the published Allure report.
 * Reads the values from .env (local) or the environment (CI secrets).
 */
import fs from 'node:fs';
import path from 'node:path';

try {
  process.loadEnvFile(path.resolve(import.meta.dirname, '..', '.env'));
} catch {
  /* no .env: CI provides the values as environment variables */
}

const MASK = '******';
const secrets = [process.env.TEST_USER_PASSWORD, process.env.TEST_USER_EMAIL]
  .filter((v) => v && v.length >= 3)
  .flatMap((v) => [...new Set([v, JSON.stringify(v).slice(1, -1), encodeURIComponent(v)])]);

const resultsDir = path.resolve(import.meta.dirname, '..', process.argv[2] ?? 'allure-results');
if (!fs.existsSync(resultsDir)) {
  console.log(`[redact] ${resultsDir} not found, nothing to do`);
  process.exit(0);
}
if (secrets.length === 0) {
  console.log('[redact] TEST_USER_* not set, nothing to redact');
  process.exit(0);
}

const TEXT_FILE = /\.(json|txt|log|xml|html|csv|properties|md|js)$/i;
let files = 0;
let replacements = 0;

for (const entry of fs.readdirSync(resultsDir, { recursive: true })) {
  const file = path.join(resultsDir, entry.toString());
  if (!TEXT_FILE.test(file) || !fs.statSync(file).isFile()) continue;
  const original = fs.readFileSync(file, 'utf8');
  let text = original;
  for (const secret of secrets) {
    const parts = text.split(secret);
    replacements += parts.length - 1;
    text = parts.join(MASK);
  }
  if (text !== original) {
    fs.writeFileSync(file, text);
    files++;
  }
}

console.log(`[redact] masked ${replacements} credential occurrence(s) in ${files} file(s)`);
