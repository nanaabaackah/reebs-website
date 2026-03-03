import React, { createContext, useContext, useEffect, useState } from "react";
import { getAuthToken, setAuthToken } from "../utils/organization.js";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authReady, setAuthReady] = useState(false);
  const storageKey = "reebs_auth_user";

  const readStoredUser = () => {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(storageKey) || window.sessionStorage.getItem(storageKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const writeStoredUser = (nextUser, remember) => {
    if (typeof window === "undefined") return;
    try {
      if (remember) {
        window.localStorage.setItem(storageKey, JSON.stringify(nextUser));
        window.sessionStorage.removeItem(storageKey);
      } else {
        window.sessionStorage.setItem(storageKey, JSON.stringify(nextUser));
        window.localStorage.removeItem(storageKey);
      }
    } catch (err) {
      console.warn("Failed to persist user", err);
    }
  };

  const updateStoredUser = (nextUser) => {
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem(storageKey)) {
        window.localStorage.setItem(storageKey, JSON.stringify(nextUser));
      } else if (window.sessionStorage.getItem(storageKey)) {
        window.sessionStorage.setItem(storageKey, JSON.stringify(nextUser));
      } else {
        window.localStorage.setItem(storageKey, JSON.stringify(nextUser));
      }
    } catch (err) {
      console.warn("Failed to persist user", err);
    }
  };

  const clearStoredUser = () => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(storageKey);
      window.sessionStorage.removeItem(storageKey);
    } catch (err) {
      console.warn("Failed to clear auth cache", err);
    }
  };

  useEffect(() => {
    const storedUser = readStoredUser();
    if (storedUser) {
      setUser(storedUser);
      setAuthToken(storedUser?.token);
    }
    setAuthReady(true);
  }, []);

  const login = async (email, password, remember = true) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/.netlify/functions/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Login failed");
      setUser(data);
      setAuthToken(data?.token);
      writeStoredUser(data, remember);
      return data;
    } catch (err) {
      setAuthError(err.message || "Login failed");
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    const token = getAuthToken();
    if (token && typeof window !== "undefined" && typeof window.fetch === "function") {
      window.fetch("/.netlify/functions/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).catch((err) => {
        console.warn("Failed to close auth session", err);
      });
    }
    setUser(null);
    setAuthToken("");
    clearStoredUser();
  };

  const updateUser = (nextUser) => {
    if (!nextUser) {
      setUser(nextUser);
      setAuthToken("");
      clearStoredUser();
      return;
    }
    const baseUser = user && typeof user === "object" ? user : {};
    const mergedUser = { ...baseUser, ...nextUser };
    if (baseUser.token && !mergedUser.token) {
      mergedUser.token = baseUser.token;
    }
    setUser(mergedUser);
    setAuthToken(mergedUser?.token);
    updateStoredUser(mergedUser);
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    authLoading,
    authError,
    authReady,
    isAuthenticated: Boolean(user),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
