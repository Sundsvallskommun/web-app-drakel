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
    throw error;
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

  // caremanagement's contract source is intentionally explicit. In test it can point at the real
  // caremanagement OpenAPI via WSO2, even when runtime traffic goes to another configured host.
  // CAREMANAGEMENT_OPENAPI_URL wins; otherwise we use CAREMANAGEMENT_BASE_URL/api-docs.
  const caremanagementOpenApiUrl = process.env.CAREMANAGEMENT_OPENAPI_URL || `${CAREMANAGEMENT_BASE_URL}/api-docs`;
  await generateContract('caremanagement', caremanagementOpenApiUrl);
};

void main().catch(error => {
  console.error(`contract generation failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
