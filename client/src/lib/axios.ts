import axios from "axios";

const BASEURL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: BASEURL,
  withCredentials: true,
});

api.defaults.headers.common["Content-Type"] = "application/json";
