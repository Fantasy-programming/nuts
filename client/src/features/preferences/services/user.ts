import { api as axios } from "@/lib/axios";

const BASEURI = "/users";

const getMe = async () => {
  const response = await axios.get<UserInfo>(`${BASEURI}/me`);
  return response.data;
};

const updateMe = async (info: Partial<UserInfo>) => {
  const response = await axios.put<UserInfo>(`${BASEURI}/me`, info);
  return response.data;
};

const createPassword = async (password: string) => {
  await axios.post(`${BASEURI}/me/password`, { password })
}

const updatePassword = async ({ current_password, password }: { current_password: string, password: string }) => {
  await axios.put(`${BASEURI}/me/password`, { password, current_password })
}

const updateAvatar = async (formData: FormData) => {
  const response = await axios.put<{ avatar_url: string }>(`${BASEURI}/me/avatar`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export interface UserInfo {
  email: string;
  avatar_url?: string;
  first_name?: string;
  last_name?: string;
  mfa_enabled: boolean;
  createdAt: string;
  updatedAt: string;
  has_password: boolean;
  linked_accounts?: LinkedAccount[];
}

export interface LinkedAccount {
  id: string
  provider: string
  created_at: Date
}

export const userService = { getMe, updateMe, updateAvatar, createPassword, updatePassword };
