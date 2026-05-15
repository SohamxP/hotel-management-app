import axios from "axios";

const DEMO_TOKEN = "hotel-management-demo-token";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5001";

export const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    Authorization: `Bearer ${DEMO_TOKEN}`,
  },
});

export function setAuthToken(token: string | null) {
  if (token) {
    API.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    API.defaults.headers.common.Authorization = `Bearer ${DEMO_TOKEN}`;
  }
}

export function getCurrentAuthToken() {
  return API.defaults.headers.common.Authorization;
}

export function getApiErrorMessage(error: any) {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong"
  );
}