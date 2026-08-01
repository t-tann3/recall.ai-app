import axios from "axios";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export const API_BASE_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001",
);

export const AUTH_TOKEN_KEY = "shoptalk_auth_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  else localStorage.removeItem(AUTH_TOKEN_KEY);
}

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

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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
