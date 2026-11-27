const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const newman = require('newman');

const PORT = process.env.TEST_PORT || '3055';
const BASE_URL = `http://localhost:${PORT}`;
const SERVER_PATH = path.resolve(__dirname, '../../backend/server.js');
const COLLECTION_PATH = path.join(__dirname, 'Student_Management_API.postman_collection.json');
const ENV_PATH = path.join(__dirname, 'Local_Environment.postman_environment.json');
const JSON_REPORT = path.join(__dirname, 'postman-execution-results.json');
const TEXT_LOG = path.join(__dirname, 'postman-execution-log.txt');

async function waitForHealth(url, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/api/health`);
      if (res.ok) return;
    } catch {}
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('Server did not become healthy within timeout');
}

async function run() {
  const server = spawn('node', [SERVER_PATH], {
    env: { ...process.env, PORT },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  try {
    await waitForHealth(BASE_URL);

    await new Promise((resolve, reject) => {
      newman.run(
        {
          collection: require(COLLECTION_PATH),
          environment: require(ENV_PATH),
          envVar: [{ key: 'baseUrl', value: BASE_URL }],
          reporters: ['cli', 'json'],
          reporter: { json: { export: JSON_REPORT } }
        },
        (err, summary) => {
          if (err) return reject(err);

          const lines = [];
          lines.push('=== Postman / Newman API Execution Summary ===');
          lines.push(`Timestamp: ${new Date().toISOString()}`);
          lines.push(`Base URL: ${BASE_URL}`);
          lines.push(`Requests Executed: ${summary.run.stats.requests.total}`);
          lines.push(`Assertions Total: ${summary.run.stats.assertions.total}`);
          lines.push(`Assertions Failed: ${summary.run.stats.assertions.failed}`);
          lines.push('');
          summary.run.executions.forEach((ex, idx) => {
            const status = ex.response ? ex.response.code : 'N/A';
            const time = ex.response ? `${ex.response.responseTime}ms` : 'N/A';
            const assertions = (ex.assertions || []).map(
              a => `  [${a.error ? 'FAIL' : 'PASS'}] ${a.assertion}`
            );
            lines.push(`${idx + 1}. ${ex.item.name} -> HTTP ${status} (${time})`);
            lines.push(...assertions);
          });

          fs.writeFileSync(TEXT_LOG, lines.join('\n') + '\n', 'utf8');

          if (summary.run.failures.length > 0) {
            return reject(new Error(`${summary.run.failures.length} Postman assertion(s) failed`));
          }
          resolve();
        }
      );
    });
  } finally {
    server.kill();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
