'use client';

import { ServiceResponse } from '@interfaces/services';
import { apiURL } from '@utils/api-url';
import axios, { AxiosError } from 'axios';

export interface ApiResponse<T = unknown> {
  data: T;
  message: string;
}

/**
 * Normalizes a caught request rejection into the ServiceResponse error shape used across the
 * service layer, so each service's `.catch` is a single typed call instead of an inline `any`.
 */
export const toServiceError = (error: unknown): ServiceResponse<never> => {
  if (axios.isAxiosError<ApiResponse>(error)) {
    return { message: error.response?.data?.message, error: error.response?.status ?? 'UNKNOWN ERROR' };
  }
  return { error: 'UNKNOWN ERROR' };
};

const isAuthPath = (pathname: string): boolean => /\/login|\/logout/.test(pathname);

export const handleError = (error: AxiosError<ApiResponse>) => {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  // An expired or missing session surfaces as 401 — send the user back to the login page (unless
  // we are already on an auth page), preserving where they were so they return after logging in.
  if (error?.response?.status === 401 && !isAuthPath(pathname)) {
    const failMessage = error.response?.data?.message ?? 'NOT_AUTHORIZED';
    window.location.href = `/login?path=${pathname}&failMessage=${failMessage}`;
  }

  throw error;
};

const defaultOptions = {
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const get = <T>(url: string, options?: Record<string, any>) =>
  axios.get<T>(apiURL(url), { ...defaultOptions, ...options }).catch(handleError);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const post = <T>(url: string, data: any, options?: Record<string, any>) => {
  return axios.post<T>(apiURL(url), data, { ...defaultOptions, ...options }).catch(handleError);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const remove = <T>(url: string, options?: Record<string, any>) => {
  return axios.delete<T>(apiURL(url), { ...defaultOptions, ...options }).catch(handleError);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const patch = <T>(url: string, data: any, options?: Record<string, any>) => {
  return axios.patch<T>(apiURL(url), data, { ...defaultOptions, ...options }).catch(handleError);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const put = <T>(url: string, data: any, options?: Record<string, any>) => {
  return axios.put<T>(apiURL(url), data, { ...defaultOptions, ...options }).catch(handleError);
};

export const apiService = { get, post, put, patch, delete: remove };
