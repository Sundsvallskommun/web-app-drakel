//Subscribed APIS as lowercased
export const APIS = [
  {
    name: 'simulatorserver',
    version: '2.0',
  },
  {
    // Citizen — resolves a stakeholder's partyId (externalId) to their personnummer for display.
    name: 'citizen',
    version: '3.0',
  },
  {
    // Messaging — sends the beslut as a brev (letter).
    name: 'messaging',
    version: '7.0',
  },
  {
    name: 'templating',
    version: '2.1',
  },
  {
    // caremanagement — the errands, and (through its /lifecare routes) everything drakel does in Lifecare.
    // Its contract is generated from its own source, see swagger-typescript-api.ts.
    name: 'caremanagement',
    version: '1.0',
  },
  {
    // Active Directory — the handläggare roster. Runtime only: the roster's shape is typed by hand (AdUser).
    name: 'activedirectory',
    version: '2.0',
  },
] as const;

// Every upstream API is reached through the WSO2 gateway (API_BASE_URL), with the OAuth2 client-credentials
// token from ApiTokenService — build its URLs with gatewayUrl.

export type ApiName = (typeof APIS)[number]['name'];

export const getApiBase = (name: ApiName) => {
  const api = APIS.find(api => api.name === name);
  return `${api?.name}/${api?.version}`;
};
