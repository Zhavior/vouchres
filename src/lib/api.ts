import axios from "axios";

// Support both VITE_API_URL and VITE_API_BASE_URL
const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("vouchedge_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err?.response?.status === 401 && !err.config._retried) {
      const refresh = localStorage.getItem("vouchedge_refresh_token");
      if (refresh) {
        try {
          const r = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refresh,
          });
          localStorage.setItem("vouchedge_access_token", r.data.access_token);
          localStorage.setItem("vouchedge_refresh_token", r.data.refresh_token);
          err.config._retried = true;
          return api(err.config);
        } catch {
          localStorage.removeItem("vouchedge_access_token");
          localStorage.removeItem("vouchedge_refresh_token");
        }
      }
    }
    return Promise.reject(err);
  }
);

export { API_BASE_URL };

// Check if API is configured (for production safety)
export function isApiConfigured(): boolean {
  // In production, VITE_API_URL should be set
  // In dev, /v1 works via Vite proxy
  if (import.meta.env.PROD && !import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_BASE_URL) {
    return false;
  }
  return true;
}
