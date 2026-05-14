import axios from "axios";

const DEMO_TOKEN = "hotel-management-demo-token";

export const API = axios.create({
  baseURL: "http://localhost:5001",
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