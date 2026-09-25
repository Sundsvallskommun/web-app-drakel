import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import { getApiBase } from './config/api-config';
import { APIS, API_BASE_URL } from './config/index';

const execFileAsync = promisify(execFile);

const PATH_TO_OUTPUT_DIR = path.resolve(process.cwd(), './src/data-contracts');

// Resolve the locally-installed swagger-typescript-api CLI entry and run it with the current Node
// binary (process.execPath). This is cross-platform: it avoids spawning `npx`, which fails on Windows
// when invoked via execFile (no shell to resolve the `.cmd` shim → ENOENT), and never reaches outside
// the repo's node_modules.
const SWAGGER_TYPESCRIPT_API_CLI = require.resolve('swagger-typescript-api/cli');

// APIs whose contract is not generated in the gateway loop: caremanagement has its own source (below), and
// Active Directory's roster is typed by hand.
const NOT_IN_GATEWAY_LOOP: readonly string[] = ['caremanagement', 'activedirectory'];

/** An OpenAPI document from a URL, or from a local file (e.g. a branch's openapi.yaml not yet on the gateway). */
const readOpenApi = async (name: string, source: string): Promise<string> => {
  if (!/^https?:\/\//.test(source)) {
    return fs.readFileSync(path.resolve(source), 'utf-8');
  }
  // Fail loudly on a non-2xx so an HTML error page can never be written out as a spec.
  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(`failed to download ${name} OpenAPI: ${response.status} ${response.statusText}`);
  }
  return response.text();
};

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
  fs.writeFileSync(swaggerPath, await readOpenApi(name, swaggerUrl));
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
  for (const api of APIS.filter(api => !NOT_IN_GATEWAY_LOOP.includes(api.name))) {
    await generateContract(api.name, `${API_BASE_URL}/${api.name}/${api.version}/api-docs`);
  }

  // caremanagement's contract comes from the gateway like the rest — unless CAREMANAGEMENT_OPENAPI_URL points
  // elsewhere: a URL, or a local file such as the openapi.yaml of a caremanagement branch the gateway does not
  // publish yet.
  const caremanagementOpenApiUrl = process.env.CAREMANAGEMENT_OPENAPI_URL || `${API_BASE_URL}/${getApiBase('caremanagement')}/api-docs`;
  await generateContract('caremanagement', caremanagementOpenApiUrl);
};

void main().catch(error => {
  console.error(`contract generation failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
