"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";
import type { Agent, TokenResponse } from "@/types";

interface AuthState {
  agent: Agent | null;
  loading: boolean;
  login: (email: string, password: string, orgSlug: string) => Promise<void>;
  register: (orgName: string, orgSlug: string, email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setAgent({ id: payload.sub, org_id: payload.org } as Agent);
      } catch {
        localStorage.removeItem("access_token");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, orgSlug: string) => {
    const tokens = await api.post<TokenResponse>("/api/auth/login", { email, password, org_slug: orgSlug });
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    const payload = JSON.parse(atob(tokens.access_token.split(".")[1]));
    setAgent({ id: payload.sub, org_id: payload.org } as Agent);
  };

  const register = async (orgName: string, orgSlug: string, email: string, password: string, name: string) => {
    const tokens = await api.post<TokenResponse>("/api/auth/register", {
      org_name: orgName, org_slug: orgSlug, email, password, name,
    });
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    const payload = JSON.parse(atob(tokens.access_token.split(".")[1]));
    setAgent({ id: payload.sub, org_id: payload.org } as Agent);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setAgent(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext value={{ agent, loading, login, register, logout }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
