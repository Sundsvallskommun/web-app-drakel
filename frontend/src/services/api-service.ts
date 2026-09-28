'use client';

import { ServiceResponse } from '@interfaces/services';
import { apiURL } from '@utils/api-url';
import { basePath, withoutBasePath } from '@utils/base-path';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

export interface ApiResponse<T = unknown> {
  data: T;
  message: string;
  /** On an error: facts beside the message, e.g. which document failed. */
  details?: Record<string, string>;
}

/**
 * Normalizes a caught request rejection into the ServiceResponse error shape used across the
 * service layer, so each service's `.catch` is a single typed call instead of an inline `any`.
 */
export const toServiceError = (error: unknown): ServiceResponse<never> => {
  if (axios.isAxiosError<ApiResponse>(error)) {
    return {
      message: error.response?.data?.message,
      details: error.response?.data?.details,
      error: error.response?.status ?? 'UNKNOWN ERROR',
    };
  }
  return { error: 'UNKNOWN ERROR' };
};

/**
 * Unwraps the backend's `{ data, message }` envelope into a ServiceResponse; a rejection becomes the error
 * shape (toServiceError). The one line every read and most writes in the service layer end with.
 */
export const unwrapData = <Data>(request: Promise<{ data: { data: Data } }>): Promise<ServiceResponse<Data>> =>
  request.then((response) => ({ data: response.data.data })).catch(toServiceError);

/**
 * As unwrapData, with the unwrapped data passed through `transform` first — a default for an envelope whose data may
 * be missing, a field of it, a sort order.
 */
export const mapData = <Envelope extends { data?: unknown }, Result>(
  request: Promise<{ data: Envelope }>,
  transform: (data: Envelope['data']) => Result
): Promise<ServiceResponse<Result>> =>
  request.then((response) => ({ data: transform(response.data.data) })).catch(toServiceError);

/** For a write whose answer is not used: resolves with `data: null`, or the error shape on a rejection. */
export const discardData = (request: Promise<unknown>): Promise<ServiceResponse<null>> =>
  request.then(() => ({ data: null })).catch(toServiceError);

const isAuthPath = (pathname: string): boolean => /\/login|\/logout/.test(pathname);

const handleError = (error: AxiosError<ApiResponse>) => {
  const pathname = typeof window !== 'undefined' ? withoutBasePath(window.location.pathname) : '';

  // An expired or missing session surfaces as 401 — send the user back to the login page (unless
  // we are already on an auth page), preserving where they were so they return after logging in.
  if (error?.response?.status === 401 && !isAuthPath(pathname)) {
    const failMessage = error.response?.data?.message ?? 'NOT_AUTHORIZED';
    const loginQuery = new URLSearchParams({ path: pathname, failMessage });
    window.location.href = `${basePath}/login?${loginQuery.toString()}`;
  }

  throw error;
};

const defaultOptions: AxiosRequestConfig = {
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
};

const get = <T>(url: string, options?: AxiosRequestConfig) =>
  axios.get<T>(apiURL(url), { ...defaultOptions, ...options }).catch(handleError);

const post = <T>(url: string, data: unknown, options?: AxiosRequestConfig) => {
  return axios.post<T>(apiURL(url), data, { ...defaultOptions, ...options }).catch(handleError);
};

const remove = <T>(url: string, options?: AxiosRequestConfig) => {
  return axios.delete<T>(apiURL(url), { ...defaultOptions, ...options }).catch(handleError);
};

const patch = <T>(url: string, data: unknown, options?: AxiosRequestConfig) => {
  return axios.patch<T>(apiURL(url), data, { ...defaultOptions, ...options }).catch(handleError);
};

const put = <T>(url: string, data: unknown, options?: AxiosRequestConfig) => {
  return axios.put<T>(apiURL(url), data, { ...defaultOptions, ...options }).catch(handleError);
};

export const apiService = { get, post, put, patch, delete: remove };
