import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, getToken, setToken } from "./api";
import type { AuthUser } from "../types";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  can: (module: string, action: string) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, if a token exists, resolve the current user.
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api
      .get<AuthUser>("/api/auth/me")
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(identifier: string, password: string) {
    const res = await api.post<{ token: string; user: AuthUser }>("/api/auth/login", {
      identifier,
      password,
    });
    setToken(res.token);
    const me = await api.get<AuthUser>("/api/auth/me");
    setUser(me);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  function can(module: string, action: string) {
    return user?.permissions?.includes(`${module}:${action}`) ?? false;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
