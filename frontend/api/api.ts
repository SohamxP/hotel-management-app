import axios from "axios";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "http://localhost:5001";

export const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

let unauthorizedHandler:
  | (() => void | Promise<void>)
  | null = null;

export function setAuthToken(
  token: string | null
) {
  if (token) {
    API.defaults.headers.common.Authorization =
      `Bearer ${token}`;
  } else {
    delete API.defaults.headers
      .common.Authorization;
  }
}

export function setUnauthorizedHandler(
  handler:
    | (() => void | Promise<void>)
    | null
) {
  unauthorizedHandler = handler;
}

export function getApiErrorMessage(
  error: any
) {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong"
  );
}

API.interceptors.response.use(
  (response) => response,

  async (error) => {
    if (
      error?.response?.status ===
        401 &&
      unauthorizedHandler
    ) {
      await unauthorizedHandler();
    }

    return Promise.reject(error);
  }
);