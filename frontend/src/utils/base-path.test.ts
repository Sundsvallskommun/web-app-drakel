import { afterEach, describe, expect, it, vi } from 'vitest';

const loadWithBasePath = async (basePathValue: string) => {
  vi.stubEnv('NEXT_PUBLIC_BASE_PATH', basePathValue);
  vi.resetModules();
  const basePathModule = await import('./base-path');
  const appUrlModule = await import('./app-url');
  return { ...basePathModule, ...appUrlModule };
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('withoutBasePath', () => {
  it('strips the basePath from a browser pathname', async () => {
    const { withoutBasePath } = await loadWithBasePath('/drakel');
    expect(withoutBasePath('/drakel/sv/oversikt')).toBe('/sv/oversikt');
    expect(withoutBasePath('/drakel')).toBe('/');
  });

  it('leaves paths outside the basePath untouched', async () => {
    const { withoutBasePath } = await loadWithBasePath('/drakel');
    expect(withoutBasePath('/drakelx/oversikt')).toBe('/drakelx/oversikt');
  });

  it('is a no-op when served at the root', async () => {
    const { withoutBasePath } = await loadWithBasePath('');
    expect(withoutBasePath('/sv/oversikt')).toBe('/sv/oversikt');
  });
});

describe('appURL', () => {
  it('prefixes the basePath to app paths', async () => {
    const { appURL } = await loadWithBasePath('/drakel');
    expect(appURL('/sv/oversikt')).toBe(`${window.location.origin}/drakel/sv/oversikt`);
    expect(appURL()).toBe(`${window.location.origin}/drakel`);
  });

  it('works when served at the root', async () => {
    const { appURL } = await loadWithBasePath('');
    expect(appURL('/login')).toBe(`${window.location.origin}/login`);
  });
});
