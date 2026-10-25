"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { getMe, login as apiLogin, logout as apiLogout } from "@/lib/api/auth";
import { setUnauthorizedHandler } from "@/lib/api/client";
import { clearStoredUserId, setStoredUserId } from "@/lib/auth/storage";
import type { AuthRole, AuthStatus, AuthUser } from "@/types/auth";

type AuthContextValue = {
  user: AuthUser | null;
  role: AuthRole | null;
  permissions: string[];
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const LOGIN_PATH = "/dcs-panel/login";

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  // Avoids redundant redirects if multiple 401s land in the same tick.
  const redirectingRef = useRef(false);

  const clearAuthState = useCallback(() => {
    setUser(null);
    clearStoredUserId();
    setStatus("unauthenticated");
  }, []);

  const redirectToLogin = useCallback(() => {
    if (redirectingRef.current) return;
    redirectingRef.current = true;
    clearAuthState();
    router.push(LOGIN_PATH);
  }, [clearAuthState, router]);

  const refresh = useCallback(async () => {
    try {
      const response = await getMe();
      setUser(response.user);
      setStatus("authenticated");
      redirectingRef.current = false;
    } catch {
      // Any failure (401, network, etc.) means "not authenticated" — the
      // API client already surfaces a real error for callers that care;
      // here we only need the boolean outcome.
      clearAuthState();
    }
  }, [clearAuthState]);

  // Central 401 handling: any apiFetch() call anywhere in the app that
  // gets a 401 routes through here, not just the initial /me check.
  useEffect(() => {
    setUnauthorizedHandler(redirectToLogin);
    return () => setUnauthorizedHandler(null);
  }, [redirectToLogin]);

  // On app load: rebuild auth state from the server. The dcs_user_id
  // value in localStorage (if any) is never read here — it is not an
  // authentication mechanism, only a client-side reference written
  // during login. The HttpOnly cookie, sent automatically, is what
  // actually authenticates this request.
  //
  // Fetches directly here (rather than calling the `refresh` callback)
  // so every setState call is lexically inside this effect's own async
  // scope, after an await — the pattern react-hooks/set-state-in-effect
  // expects, since it can't trace state updates through an external
  // useCallback indirection.
  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      try {
        const response = await getMe();
        if (cancelled) return;
        setUser(response.user);
        setStatus("authenticated");
      } catch {
        if (cancelled) return;
        clearAuthState();
      }
    }

    void loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [clearAuthState]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await apiLogin({ email, password });
      setStoredUserId(response.user.user_id);
      await refresh();
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      clearAuthState();
    }
  }, [clearAuthState]);

  const value: AuthContextValue = {
    user,
    role: user?.role ?? null,
    permissions: user?.permissions ?? [],
    status,
    login,
    logout,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth() must be used within an <AuthProvider>");
  }
  return ctx;
}
