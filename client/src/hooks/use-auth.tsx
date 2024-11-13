import { Context } from "@/contexts/auth.context";
import { useContext } from "react";

export const useAuth = () => {
  const context = useContext(Context);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
