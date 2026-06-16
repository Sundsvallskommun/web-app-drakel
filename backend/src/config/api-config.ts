//Subscribed APIS as lowercased
export const APIS = [
  {
    name: 'simulatorserver',
    version: '2.0',
  },
] as const;

//TEST ONLY PRODUCTION NEED THIS API
// NOTE: caremanagement is intentionally NOT in APIS. It is reached directly on its own host
// (Dokploy) via CAREMANAGEMENT_BASE_URL, not through the shared API gateway, so its data
// contract is generated separately, straight from that instance — see swagger-typescript-api.ts.

type ApiName = (typeof APIS)[number]['name'];

export const getApiBase = (name: ApiName) => {
  const api = APIS.find(api => api.name === name);
  return `${api?.name}/${api?.version}`;
};
