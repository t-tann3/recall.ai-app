"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getMe,
  login as loginRequest,
  signup as signupRequest,
  type PublicHiringManager,
} from "@/lib/api/auth";
import { getStoredToken, setStoredToken } from "@/lib/api/client";

type AuthContextValue = {
  hiringManager: PublicHiringManager | null;
  ready: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: {
    name: string;
    email: string;
    password: string;
    team?: string;
    title?: string;
  }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [hiringManager, setHiringManager] = useState<PublicHiringManager | null>(
    null,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const token = getStoredToken();
      if (!token) {
        if (!cancelled) setReady(true);
        return;
      }
      try {
        const { hiringManager: me } = await getMe();
        if (!cancelled) setHiringManager(me);
      } catch {
        setStoredToken(null);
        if (!cancelled) setHiringManager(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest({ email, password });
    setStoredToken(result.token);
    setHiringManager(result.hiringManager);
  }, []);

  const signup = useCallback(
    async (input: {
      name: string;
      email: string;
      password: string;
      team?: string;
      title?: string;
    }) => {
      const result = await signupRequest(input);
      setStoredToken(result.token);
      setHiringManager(result.hiringManager);
    },
    [],
  );

  const logout = useCallback(() => {
    setStoredToken(null);
    setHiringManager(null);
  }, []);

  const value = useMemo(
    () => ({
      hiringManager,
      ready,
      isAuthenticated: Boolean(hiringManager),
      login,
      signup,
      logout,
    }),
    [hiringManager, ready, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
