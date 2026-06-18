import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import { config } from 'dotenv';

config({ quiet: true });

const execFileAsync = promisify(execFile);

const PATH_TO_OUTPUT_DIR = path.resolve(process.cwd(), './src/data-contracts');

// Resolve the locally-installed swagger-typescript-api CLI entry and run it with the current Node
// binary (process.execPath). Cross-platform: avoids spawning `npx`/`curl` (which break on Windows) and
// never reaches outside the repo's node_modules.
const SWAGGER_TYPESCRIPT_API_CLI = require.resolve('swagger-typescript-api/cli');

const main = async () => {
  const backendDir = `${PATH_TO_OUTPUT_DIR}/backend`;
  // Keep the downloaded spec OUT of src (a .json there would be type-checked and break the build) —
  // it's only an intermediate for the generator, so write it to a temp file and remove it afterwards.
  const swaggerPath = path.join(os.tmpdir(), 'drakel-contract-backend.spec');

  if (!fs.existsSync(backendDir)) {
    fs.mkdirSync(backendDir, { recursive: true });
  }

  console.warn('Downloading and generating api-docs for backend');

  // Download the backend's swagger with Node's built-in fetch. Fail loudly on a non-2xx so an HTML
  // error page can never be written out as a spec.
  const swaggerUrl = `${process.env.NEXT_PUBLIC_API_URL}/swagger.json`;
  const response = await fetch(swaggerUrl);
  if (!response.ok) {
    throw new Error(`failed to download backend OpenAPI: ${response.status} ${response.statusText}`);
  }
  fs.writeFileSync(swaggerPath, await response.text());

  try {
    const { stdout } = await execFileAsync(process.execPath, [
      SWAGGER_TYPESCRIPT_API_CLI,
      'generate',
      '--modular',
      '-p',
      swaggerPath,
      '-o',
      backendDir,
      '--no-client',
      '--clean-output',
      '--extract-enums',
    ]);
    console.warn(`Data-contract-generator: ${stdout}`);
  } finally {
    fs.rmSync(swaggerPath, { force: true });
  }
};

void main().catch((error) => {
  console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
