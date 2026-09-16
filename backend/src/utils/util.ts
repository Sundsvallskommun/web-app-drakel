import { API_BASE_URL } from '@config';

export const apiURL = (...parts: string[]): string => {
  const urlParts = [API_BASE_URL, ...parts];
  return urlParts.map(pathPart => pathPart.replace(/(^\/|\/$)/g, '')).join('/');
};

export const isValidUrl = (string: string) => {
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === 'http:' || url.protocol === 'https:';
};
