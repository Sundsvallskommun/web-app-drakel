// @vitest-environment node
import { NextRequest } from 'next/server';
import { i18nRouter } from 'next-i18n-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

const routeWithBasePath = async (basePathValue: string, url: string) => {
  vi.stubEnv('NEXT_PUBLIC_BASE_PATH', basePathValue);
  vi.resetModules();
  const { default: i18nConfig } = await import('./i18nConfig');
  const request = new NextRequest(url, { nextConfig: { basePath: basePathValue } });
  return i18nRouter(request, i18nConfig);
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('i18nConfig with next-i18n-router', () => {
  it('keeps the basePath when rewriting an unprefixed path to the default language', async () => {
    const response = await routeWithBasePath('/drakel', 'http://localhost:3000/drakel/oversikt');
    expect(response.headers.get('x-middleware-rewrite')).toBe('http://localhost:3000/drakel/sv/oversikt');
  });

  it('keeps the basePath when redirecting away from the default language prefix', async () => {
    const response = await routeWithBasePath('/drakel', 'http://localhost:3000/drakel/sv/oversikt');
    expect(response.headers.get('location')).toBe('http://localhost:3000/drakel/oversikt');
  });

  it('rewrites at the root when no basePath is set', async () => {
    const response = await routeWithBasePath('', 'http://localhost:3000/oversikt');
    expect(response.headers.get('x-middleware-rewrite')).toBe('http://localhost:3000/sv/oversikt');
  });
});
