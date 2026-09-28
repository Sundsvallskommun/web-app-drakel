/* eslint-disable @typescript-eslint/no-require-imports */
const envalid = require('envalid');

const authDependent = envalid.makeValidator((x) => {
  const authEnabled = process.env.HEALTH_AUTH === 'true';

  if (authEnabled && !x.length) {
    throw new Error(`Can't be empty if "HEALTH_AUTH" is true`);
  }

  return x;
});

envalid.cleanEnv(process.env, {
  NEXT_PUBLIC_API_URL: envalid.str(),
  HEALTH_AUTH: envalid.bool(),
  HEALTH_USERNAME: authDependent(),
  HEALTH_PASSWORD: authDependent(),
});

// Sent on every response. The CSP is deliberately limited to directives that need no nonce or allowlist:
// frame-ancestors (no framing by other sites), object-src (no plugins) and base-uri (no <base> hijacking).
// It sets no frame-src/script-src, so the PDF previews — blob: object URLs in iframes — keep working.
// TODO: add script-src once the app's inline scripts carry nonces.
const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'" },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
];

module.exports = {
  output: 'standalone',
  // Next prefixes `source` with basePath itself, so '/:path*' covers every route under the app's base path.
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
  images: {
    remotePatterns: process.env.DOMAIN_NAME ? [{ protocol: 'https', hostname: process.env.DOMAIN_NAME }] : [],
    formats: ['image/avif', 'image/webp'],
  },
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  experimental: {
    optimizePackageImports: ['@sk-web-gui/core', '@sk-web-gui/react', 'dayjs'],
  },
  async rewrites() {
    return [{ source: '/napi/:path*', destination: '/api/:path*' }];
  },
};