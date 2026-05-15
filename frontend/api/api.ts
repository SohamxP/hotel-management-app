import axios from "axios";

const DEMO_TOKEN = "hotel-management-demo-token";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5001";

export const API = axios.create({
  baseURL: API_URL,
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