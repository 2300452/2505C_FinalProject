import axios from "axios";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== "undefined" ? "http://localhost:8000" : "/api");

const api = axios.create({
  baseURL: apiBaseUrl,
});

export default api;
