import { gatewayUrl, ownHostOrGatewayUrl } from '@utils/gateway-url';
import { describe, expect, it } from 'vitest';

describe('ownHostOrGatewayUrl', () => {
  it("builds the URL on the API's own host when one is configured", () => {
    expect(ownHostOrGatewayUrl('https://templating.drakel.sundsvall.dev/', 'templating', '2281', 'templates')).toBe(
      'https://templating.drakel.sundsvall.dev/2281/templates',
    );
  });

  it('builds the URL on the gateway when the API has no host of its own', () => {
    expect(ownHostOrGatewayUrl('', 'templating', '2281', 'templates')).toBe(gatewayUrl('templating', '2281', 'templates'));
  });
});
