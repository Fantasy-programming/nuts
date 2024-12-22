import { api as axios } from "@/lib/axios";

const BASEURI = "/user";

const getMe = async () => {
  const response = await axios.get<UserInfo>(`${BASEURI}/me`);
  return response.data;
};

interface UserInfo {
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
}

export const userService = { getMe };
