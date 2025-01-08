import { JWT } from "@/features/auth/services/auth.types";

const decodeJWT = <T>(token: string): T => {
  const payloadBase64 = token.split(".")[1]; // Extract the payload part
  const payloadJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/")); // Decode Base64-URL
  const json = JSON.parse(payloadJson); // Parse into JSON

  return json as T;
};

// Get Cookie

export const getAuthCookie = () => {
  const payload = document.cookie
    .split("; ")
    .find((row) => row.startsWith("nutsPayload="))
    ?.split("=")[1];

  if (!payload) return null;
  const decoded = decodeJWT<JWT>(payload);

  if (isSessionExpired(decoded.exp)) return null;
  return decoded;
};

// Check if token is expired
export const isSessionExpired = (exp: number) => {
  return Date.now() >= exp * 1000;
};
