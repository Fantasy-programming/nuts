import axios, { AxiosInstance } from "axios";

const BASEURL = import.meta.env.VITE_API_URL;

console.log("RES:", BASEURL);

type RefreshFn = () => Promise<string>;
type LogoutFn = () => void;

const createAPI = (
  refreshTokenFn: RefreshFn,
  logoutFn: LogoutFn,
): AxiosInstance => {
  const api = axios.create({
    baseURL: BASEURL,
    withCredentials: true,
  });

  // Setup Defaults
  api.defaults.headers.common["Content-Type"] = "application/json";

  // TODO: Reduce the operations on each request
  // TODO: Add error handling on refresh token

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response) {
        const { status } = error.response;

        if (status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const token = await refreshTokenFn();
            setHeaderToken(token);
            return Promise.resolve(token);
          } catch (refreshError) {
            logoutFn();
            return Promise.reject(refreshError);
          }
        }
      }
      return Promise.reject(error);
    },
  );

  return api;
};

export let api: AxiosInstance;

export const setHeaderToken = (token: string) => {
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
};

export const removeHeaderToken = () => {
  delete api.defaults.headers.common.Authorization;
};

export const initAPI = (
  refreshTokenFn: () => Promise<string>,
  logoutFn: () => void,
) => {
  api = createAPI(refreshTokenFn, logoutFn);
};
