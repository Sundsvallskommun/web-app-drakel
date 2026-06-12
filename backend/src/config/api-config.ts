//Subscribed APIS as lowercased
export const APIS = [
  {
    name: 'simulatorserver',
    version: '2.0',
  },
    {
    name: 'caremanagement',
    version: '1.0',
  },
] as const;

type ApiName = (typeof APIS)[number]['name'];

export const getApiBase = (name: ApiName) => {
  const api = APIS.find(api => api.name === name);
  return `${api?.name}/${api?.version}`;
};
