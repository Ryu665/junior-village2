import axios from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // refresh token 쿠키 전송용
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url?.includes("/auth/")) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post("/api/auth/refresh", {}, { withCredentials: true })
            .finally(() => {
              refreshPromise = null;
            });
        }
        const { data } = await refreshPromise;
        useAuthStore.getState().setAuth(data.accessToken, data.user);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (e) {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
