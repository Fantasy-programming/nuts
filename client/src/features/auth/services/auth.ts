import { api as axios } from "@/lib/axios";
import { LoginFormValues, SignupFormValues } from "./auth.types";

const BASEURI = "/auth";

const signup = async (credentials: SignupFormValues) => {
  const response = await axios.post(`${BASEURI}/signup`, credentials);
  return response.data;
};

const login = async (credentials: LoginFormValues) => {
  await axios.post(`${BASEURI}/login`, credentials);
};

const logout = async () => {
  await axios.post(`${BASEURI}/logout`);
};

const refresh = async () => {
  await axios.post(`${BASEURI}/refresh`)
}


export const authService = { signup, logout, login, refresh };
