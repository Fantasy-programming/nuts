import { useState, useEffect, useCallback, useMemo } from "react";
import { authService } from "../services/auth";
import type { AuthNullable } from "../services/auth.types";
import { Context } from "./auth.context";
import { getAuthCookie } from "@/lib/jwt";

const defaultState = { user: null };
const SESSION_CHECK_INTERVAL = 5000; // Check session every 5 seconds

interface SessionExpiredModalProps {
  onLogin: () => void;
}

const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({ onLogin }) => (
  <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Session Expired</h2>
      <p className="mb-4">Your session has expired. Please log in again.</p>
      <button
        type="button"
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={onLogin}
      >
        Log In
      </button>
    </div>
  </div>
);


export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AuthNullable>(() => {
    const jwt = getAuthCookie();
    return jwt ? { user: jwt } : defaultState;
  });
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
  const isLoggedIn = user.user !== null;

  const logout = useCallback(async () => {
    try {
      await authService.logout();
      setUser(defaultState);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, []);

  const storeUser = useCallback(() => {
    const jwt = getAuthCookie();
    setUser(jwt ? { user: jwt } : defaultState);
  }, []);

  useEffect(() => {
    const interval = setInterval(storeUser, SESSION_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [storeUser]);

  useEffect(() => {
    const jwt = getAuthCookie();
    if (!jwt && isLoggedIn) {
      setShowSessionExpiredModal(true);
    }
  }, [user.user, isLoggedIn]);

  const contextValue = useMemo(
    () => ({
      user,
      storeUser,
      logout,
      isLoggedIn,
    }),
    [user, storeUser, logout, isLoggedIn]
  );

  return (
    <Context.Provider value={contextValue}>
      {children}
      {showSessionExpiredModal && (
        <SessionExpiredModal
          onLogin={() => {
            setShowSessionExpiredModal(false);
            logout();
          }}
        />
      )}
    </Context.Provider>
  );
};
