"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { PublicUser } from "@/lib/users";

type AuthContextValue = {
  user: PublicUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (loginId: string, password: string) => Promise<string | null>;
  register: (
    loginId: string,
    nickname: string,
    password: string
  ) => Promise<string | null>;
  withdrawAccount: (password: string) => Promise<string | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: PublicUser | null;
}) {
  const [user, setUser] = useState<PublicUser | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();
      setUser(response.ok ? (data.user as PublicUser | null) : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialUser) {
      void refresh();
    }
  }, [initialUser, refresh]);

  const login = useCallback(async (loginId: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginId, password }),
    });
    const data = await response.json();

    if (!response.ok) {
      return (data.error as string) ?? "로그인에 실패했습니다.";
    }

    setUser(data.user as PublicUser);
    return null;
  }, []);

  const register = useCallback(
    async (loginId: string, nickname: string, password: string) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, nickname, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        return (data.error as string) ?? "회원가입에 실패했습니다.";
      }

      setUser(data.user as PublicUser);
      return null;
    },
    []
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const withdrawAccount = useCallback(async (password: string) => {
    const response = await fetch("/api/auth/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await response.json();

    if (!response.ok) {
      return (data.error as string) ?? "회원 탈퇴에 실패했습니다.";
    }

    setUser(null);
    return null;
  }, []);

  const value = useMemo(
    () => ({ user, loading, refresh, login, register, withdrawAccount, logout }),
    [user, loading, refresh, login, register, withdrawAccount, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
