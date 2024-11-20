import { useState, useEffect, useCallback, PropsWithChildren } from "react";
import { authService } from "@/services/auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { AuthNullable } from "@/services/auth.types";
import { Context } from "./auth.context";
import { flushSync } from "react-dom";
import { getAuthCookie } from "@/lib/jwt";

const defaultState = { user: null };
const SESSION_CHECK_INTERVAL = 5000; // Check session every 5 seconds

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthNullable>(defaultState);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);

  // Logout the user
  const logout = useCallback(async () => {
    setLoading(true);

    // logout the user
    await authService.logout();
    setUser(defaultState);
    setIsLoggedIn(false);

    setLoading(false);
  }, []);

  // Store the user in session storage
  const storeUser = useCallback(() => {
    setLoading(true);
    const jwt = getAuthCookie();

    if (!jwt) {
      console.error("No JWT found");
      return;
    }

    flushSync(() => {
      setUser({ user: jwt });
      setIsLoggedIn(true);
    });

    setLoading(false);
  }, []);

  // Check if the session has expired
  const checkSession = useCallback(() => {
    const jwt = getAuthCookie();

    // If JWT is missing, show the modal and trigger logout
    if (!jwt && isLoggedIn) {
      setShowSessionExpiredModal(true);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const interval = setInterval(() => {
      checkSession();
    }, SESSION_CHECK_INTERVAL);

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [checkSession]);

  useEffect(() => {
    storeUser();
    setLoading(false);
  }, [logout, storeUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  const SessionExpiredModal = () => (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Session Expired</h2>
        <p className="mb-4">Your session has expired. Please log in again.</p>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => {
            setShowSessionExpiredModal(false);
            logout();
          }}
        >
          Log In
        </button>
      </div>
    </div>
  );

  return (
    <Context.Provider value={{ user, storeUser, logout, isLoggedIn }}>
      {children}
      {showSessionExpiredModal && <SessionExpiredModal />}
    </Context.Provider>
  );
};
