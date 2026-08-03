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
  type PublicMembership,
  type PublicOrganization,
} from "@/lib/api/auth";
import { getStoredToken, setStoredToken } from "@/lib/api/client";

type AuthContextValue = {
  hiringManager: PublicHiringManager | null;
  organization: PublicOrganization | null;
  membership: PublicMembership | null;
  role: PublicMembership["role"] | null;
  ready: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: {
    name: string;
    email: string;
    password: string;
    team?: string;
    title?: string;
    organizationName?: string;
  }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [hiringManager, setHiringManager] = useState<PublicHiringManager | null>(
    null,
  );
  const [organization, setOrganization] = useState<PublicOrganization | null>(null);
  const [membership, setMembership] = useState<PublicMembership | null>(null);
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
        const me = await getMe();
        if (!cancelled) {
          setHiringManager(me.hiringManager);
          setOrganization(me.organization);
          setMembership(me.membership);
        }
      } catch {
        setStoredToken(null);
        if (!cancelled) {
          setHiringManager(null);
          setOrganization(null);
          setMembership(null);
        }
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
    setOrganization(result.organization);
    setMembership(result.membership);
  }, []);

  const signup = useCallback(
    async (input: {
      name: string;
      email: string;
      password: string;
      team?: string;
      title?: string;
      organizationName?: string;
    }) => {
      const result = await signupRequest(input);
      setStoredToken(result.token);
      setHiringManager(result.hiringManager);
      setOrganization(result.organization);
      setMembership(result.membership);
    },
    [],
  );

  const logout = useCallback(() => {
    setStoredToken(null);
    setHiringManager(null);
    setOrganization(null);
    setMembership(null);
  }, []);

  const value = useMemo(
    () => ({
      hiringManager,
      organization,
      membership,
      role: membership?.role ?? null,
      ready,
      isAuthenticated: Boolean(hiringManager && organization),
      login,
      signup,
      logout,
    }),
    [hiringManager, organization, membership, ready, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
