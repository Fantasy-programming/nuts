import { api as axios } from "@/lib/axios";
import { InitMFASchema, LoginFormValues, LoginResponse, SessionSchema, SignupFormValues } from "./auth.types";
import { AxiosResponse } from "axios";

const BASEURI = "/auth";

const signup = async (credentials: SignupFormValues) => {
  const response = await axios.post<unknown>(`${BASEURI}/signup`, credentials);
  return response.data;
};

const login = async (credentials: LoginFormValues): Promise<AxiosResponse<LoginResponse>> => {
  return await axios.post(`${BASEURI}/login`, credentials);
};

const logout = async (): Promise<void> => {
  const data = await axios.post(`${BASEURI}/logout`);
  console.debug(data)
};

const refresh = async (): Promise<void> => {
  const data = await axios.post(`${BASEURI}/refresh`)
  console.debug(data)
}

const initiateMfaSetup = async (): Promise<InitMFASchema> => {
  const response = await axios.post<InitMFASchema>(`${BASEURI}/mfa/generate`)
  return response.data
}

const verifyMfaSetup = async (code: string): Promise<void> => {
  const data = await axios.post(`${BASEURI}/mfa/enable`, { otp: code })
  console.debug(data)
}

const disableMfa = async (): Promise<void> => {
  const data = await axios.delete(`${BASEURI}/mfa/disable`)
  console.debug(data)
}

const getSessions = async (): Promise<SessionSchema[]> => {
  const response = await axios.get(`${BASEURI}/sessions`)
  return response.data
}

const revokeSession = async (sessionId: string): Promise<void> => {
  const data = await axios.delete(`${BASEURI}/sessions/${sessionId}/logout`)
  console.debug(data)
}

const unlinkSocialAccount = async (provider: 'google' | 'apple'): Promise<void> => {
  const data = await axios.delete(`${BASEURI}/oauth/${provider}/unlink`)
  console.debug(data)
}

const revokeAllOtherSessions = async (): Promise<void> => {
  const data = await axios.delete(`${BASEURI}/sessions`)
  console.debug(data)
}

export const authService = { signup, logout, login, refresh, verifyMfaSetup, initiateMfaSetup, disableMfa, getSessions, revokeSession, unlinkSocialAccount, revokeAllOtherSessions } as const;
