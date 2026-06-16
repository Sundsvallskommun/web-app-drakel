import { execFile } from 'child_process';
import fs from 'node:fs';
import path from 'path';
import { promisify } from 'util';

import { APIS, API_BASE_URL, CAREMANAGEMENT_BASE_URL } from './config/index';

// Use execFile (no shell) with argument arrays so env-derived values like API_BASE_URL and the
// swagger URL are passed as inert arguments and can never be interpreted as shell syntax.
const execFileAsync = promisify(execFile);

const PATH_TO_OUTPUT_DIR = path.resolve(process.cwd(), './src/data-contracts');

const generateContract = async (name: string, swaggerUrl: string) => {
  const apiDir = `${PATH_TO_OUTPUT_DIR}/${name}`;
  const swaggerPath = `${apiDir}/swagger.json`;

  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }

  try {
    // -fsS: fail on HTTP errors (so an error page never lands as swagger.json) while staying quiet.
    await execFileAsync('curl', ['-fsS', '-o', swaggerPath, swaggerUrl]);
    console.warn(`- ${name} (${swaggerUrl})`);

    const { stdout } = await execFileAsync('npx', [
      'swagger-typescript-api',
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
  } catch (error) {
    console.error(`error generating ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const main = async () => {
  // Build-time codegen script (not the server): console.warn/error are the repo's sanctioned
  // outputs; the winston logger is for the running app, not a one-shot CLI.
  console.warn('Downloading and generating api-docs..');

  // Gateway APIs — fetched through the shared API gateway (API_BASE_URL). Sequential for...of so
  // each API is fully downloaded and generated before the next (forEach(async) does not await).
  for (const api of APIS) {
    await generateContract(api.name, `${API_BASE_URL}/${api.name}/${api.version}/api-docs`);
  }

  // caremanagement is reached directly on its own host (Dokploy), NOT via the gateway, so its
  // OpenAPI document is downloaded straight from that instance — /api-docs at the service root,
  // the same path the gateway would proxy as /caremanagement/1.0/api-docs. Override with
  // CAREMANAGEMENT_OPENAPI_URL if the document lives elsewhere.
  const caremanagementOpenApiUrl = process.env.CAREMANAGEMENT_OPENAPI_URL || `${CAREMANAGEMENT_BASE_URL}/api-docs`;
  await generateContract('caremanagement', caremanagementOpenApiUrl);
};

void main();
