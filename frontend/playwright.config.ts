import { defineConfig, devices } from '@playwright/test';

const port = process.env.PORT ?? '3000';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const baseURL = `http://localhost:${port}${basePath}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Boots the Next dev server (TEST=true) before the suite. Locally an already-running
  // server is reused; CI always starts a fresh one. Env mirrors .env-example so envalid
  // (next.config.js) is satisfied without a checked-in .env.
  webServer: {
    command: 'yarn dev',
    // Poll the public /login path for readiness: the proxy middleware lets it through without a
    // backend session, whereas protected paths would 500 while no backend is running.
    url: `${baseURL}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_APP_NAME: 'Ekonomiskt bistånd',
      NEXT_PUBLIC_API_URL: 'http://localhost:3001/api',
      DOMAIN_NAME: 'localhost',
      BASE_PATH: '',
      NEXT_PUBLIC_BASE_PATH: '',
      ADMIN_URL: 'http://localhost:3002/',
      NEXT_PUBLIC_PROTECTED_ROUTES: '',
      HEALTH_AUTH: 'false',
      HEALTH_USERNAME: '',
      HEALTH_PASSWORD: '',
    },
  },
});
