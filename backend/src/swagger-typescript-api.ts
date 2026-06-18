import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import { APIS, API_BASE_URL, CAREMANAGEMENT_BASE_URL } from './config/index';

const execFileAsync = promisify(execFile);

const PATH_TO_OUTPUT_DIR = path.resolve(process.cwd(), './src/data-contracts');

// Resolve the locally-installed swagger-typescript-api CLI entry and run it with the current Node
// binary (process.execPath). This is cross-platform: it avoids spawning `npx`, which fails on Windows
// when invoked via execFile (no shell to resolve the `.cmd` shim → ENOENT), and never reaches outside
// the repo's node_modules.
const SWAGGER_TYPESCRIPT_API_CLI = require.resolve('swagger-typescript-api/cli');

const generateContract = async (name: string, swaggerUrl: string) => {
  const apiDir = `${PATH_TO_OUTPUT_DIR}/${name}`;
  // The downloaded spec is only an intermediate for the generator — keep it OUT of src (a .json under
  // src would be type-checked by tsc and break the build, e.g. the citizen API serves YAML). Write it to
  // a temp file and remove it afterwards.
  const swaggerPath = path.join(os.tmpdir(), `drakel-contract-${name}.spec`);

  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }

  // Download the OpenAPI document with Node's built-in fetch — cross-platform, no `curl` subprocess.
  // Fail loudly on a non-2xx so an HTML error page can never be written out as a spec.
  const response = await fetch(swaggerUrl);
  if (!response.ok) {
    throw new Error(`failed to download ${name} OpenAPI: ${response.status} ${response.statusText}`);
  }
  fs.writeFileSync(swaggerPath, await response.text());
  console.warn(`- ${name} (${swaggerUrl})`);

  try {
    const { stdout } = await execFileAsync(process.execPath, [
      SWAGGER_TYPESCRIPT_API_CLI,
      'generate',
      '--modular',
      '-p',
      swaggerPath,
      '-o',
      apiDir,
      '--no-client',
      '--extract-enums',
    ]);
    console.warn(`Data-contract-generator: ${stdout}`);
  } finally {
    fs.rmSync(swaggerPath, { force: true });
  }
};

const main = async () => {
  // Build-time codegen script (not the server): console.warn/error are the repo's sanctioned
  // outputs; the winston logger is for the running app, not a one-shot CLI.
  console.warn('Downloading and generating api-docs..');

  // Gateway APIs — fetched through the shared API gateway (API_BASE_URL). Sequential for...of so
  // each API is fully downloaded and generated before the next.
  for (const api of APIS) {
    await generateContract(api.name, `${API_BASE_URL}/${api.name}/${api.version}/api-docs`);
  }

  // caremanagement's contract source is intentionally explicit. In test it can point at the real
  // caremanagement OpenAPI via WSO2, even when runtime traffic goes to another configured host.
  // CAREMANAGEMENT_OPENAPI_URL wins; otherwise we use CAREMANAGEMENT_BASE_URL/api-docs.
  const caremanagementOpenApiUrl = process.env.CAREMANAGEMENT_OPENAPI_URL || `${CAREMANAGEMENT_BASE_URL}/api-docs`;
  await generateContract('caremanagement', caremanagementOpenApiUrl);
};

void main().catch((error) => {
  console.error(`contract generation failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
