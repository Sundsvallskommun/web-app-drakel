import { execFile } from 'child_process';
import fs from 'node:fs';
import path from 'path';
import { promisify } from 'util';

import { APIS, API_BASE_URL } from './config/index';

// Use execFile (no shell) with argument arrays so env-derived values like API_BASE_URL
// are passed as inert arguments and can never be interpreted as shell syntax.
const execFileAsync = promisify(execFile);

const PATH_TO_OUTPUT_DIR = path.resolve(process.cwd(), './src/data-contracts');

const main = async () => {
  // Build-time codegen script (not the server): console.warn/error are the repo's sanctioned
  // outputs; the winston logger is for the running app, not a one-shot CLI.
  console.warn('Downloading and generating api-docs..');
  // Sequential for...of so each API is fully downloaded and generated before the next
  // (a forEach(async) does not await between iterations).
  for (const api of APIS) {
    const apiDir = `${PATH_TO_OUTPUT_DIR}/${api.name}`;
    const swaggerPath = `${apiDir}/swagger.json`;

    if (!fs.existsSync(apiDir)) {
      fs.mkdirSync(apiDir, { recursive: true });
    }

    try {
      await execFileAsync('curl', ['-o', swaggerPath, `${API_BASE_URL}/${api.name}/${api.version}/api-docs`]);
      console.warn(`- ${api.name} ${api.version}`);

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
      console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

void main();
