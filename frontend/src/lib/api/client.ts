import axios from "axios";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export const API_BASE_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001",
);

/**
 * Shared Axios instance — import this (or the domain helpers) in pages/components.
 * All requests use NEXT_PUBLIC_API_BASE_URL as the base.
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30_000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Request failed";
    return Promise.reject(
      Object.assign(new Error(String(message)), {
        status: error.response?.status,
        data: error.response?.data,
        cause: error,
      }),
    );
  },
);
