import { api as axios } from "@/lib/axios";
import { AuthResponse, LoginFormValues, SignupFormValues } from "./auth.types";

const BASEURI = "/auth";

const signup = async (credentials: SignupFormValues) => {
  const response = await axios.post(`${BASEURI}/signup`, credentials);
  return response.data;
};

const login = async (credentials: LoginFormValues) => {
  const response = await axios.post<AuthResponse>(
    `${BASEURI}/login`,
    credentials,
  );
  return response.data;
};

const logout = async () => {
  await axios.post(`${BASEURI}/logout`);
};

export const authService = { signup, logout, login };
