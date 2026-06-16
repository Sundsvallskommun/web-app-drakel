import { expect, test } from '@playwright/test';

// Smoke test: proves Playwright drives the real Next server end-to-end. We target the public
// login route (the `proxy.ts` middleware lets it through without a backend session and i18n-routing
// redirects it to the locale-prefixed path), so this is deterministic and needs no backend.
test.describe('app shell', () => {
  test('serves the login page through i18n routing', async ({ page }) => {
    const response = await page.goto('/login');
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('body')).toBeVisible();
  });
});
