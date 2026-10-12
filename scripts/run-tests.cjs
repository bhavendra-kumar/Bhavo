/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function findTestFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findTestFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".test.ts")) {
      results.push(fullPath);
    }
  }
  return results;
}

const testsDir = path.resolve(__dirname, "..", "tests");
const testFiles = findTestFiles(testsDir);

if (testFiles.length === 0) {
  console.error(`[run-tests] Error: No *.test.ts files found under ${testsDir}`);
  process.exit(1);
}

// Sort test files for deterministic execution order
testFiles.sort();

console.log(`[run-tests] Discovered ${testFiles.length} test files.`);

// Execute Node.js test runner with tsx loader registered
const args = ["--import", "tsx", "--test", ...testFiles];

const result = spawnSync(process.execPath, args, {
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  console.error("[run-tests] Failed to execute test process:", result.error);
  process.exit(1);
}

if (result.status !== null) {
  process.exit(result.status);
} else if (result.signal) {
  console.error(`[run-tests] Test runner terminated by signal: ${result.signal}`);
  process.exit(1);
} else {
  process.exit(0);
}
