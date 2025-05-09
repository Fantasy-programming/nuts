import { api as axios } from "@/lib/axios";
import { InitMFASchema, LoginFormValues, SessionSchema, SignupFormValues } from "./auth.types";

const BASEURI = "/auth";

const signup = async (credentials: SignupFormValues) => {
  const response = await axios.post<unknown>(`${BASEURI}/signup`, credentials);
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

const initiateMfaSetup = async (): Promise<InitMFASchema> => {
  const response = await axios.post<InitMFASchema>(`${BASEURI}/mfa/initiate`)
  return response.data
}

const verifyMfaSetup = async (code: string) => {
  await axios.post(`${BASEURI}/mfa/verify`, { otp: code })
}

const disableMfa = async () => {
  await axios.delete(`${BASEURI}/mfa`)
}

const getSessions = async (): Promise<SessionSchema[]> => {
  const response = await axios.get(`${BASEURI}/sessions`)
  return response.data
}

const revokeSession = async (sessionId: string) => {
  await axios.delete(`${BASEURI}/sessions/${sessionId}/logout`)
}

const unlinkSocialAccount = async (provider: string) => {
  await axios.delete(`${BASEURI}/oauth/${provider}/unlink`)
}

const revokeAllOtherSessions = async () => {
  await axios.post(`${BASEURI}/sessions`)
}

export const authService = { signup, logout, login, refresh, verifyMfaSetup, initiateMfaSetup, disableMfa, getSessions, revokeSession, unlinkSocialAccount, revokeAllOtherSessions };
