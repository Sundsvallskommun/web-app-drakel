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
] as const;

// NOTE: caremanagement is intentionally NOT in APIS. Runtime calls are built by caremanagementUrl,
// while contract generation has its own explicit source in swagger-typescript-api.ts. In test that
// source can point at the real caremanagement OpenAPI via WSO2 instead of the Dokploy instance.

type ApiName = (typeof APIS)[number]['name'];

export const getApiBase = (name: ApiName) => {
  const api = APIS.find(api => api.name === name);
  return `${api?.name}/${api?.version}`;
};
