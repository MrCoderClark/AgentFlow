"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, API_BASE } from "./api";
import type { Agent, TokenResponse } from "@/types";

export function resolveAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url}`;
}

interface AuthState {
  agent: Agent | null;
  loading: boolean;
  login: (email: string, password: string, orgSlug: string) => Promise<void>;
  register: (orgName: string, orgSlug: string, email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateAgent: (updates: Partial<Agent>) => void;
  uploadAvatar: (file: File) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  function agentFromToken(token: string): Agent {
    const p = JSON.parse(atob(token.split(".")[1]));
    return {
      id: p.sub,
      org_id: p.org,
      name: p.name || "",
      email: p.email || "",
      avatar_url: p.avatar_url || null,
      role: "agent",
      status: "online",
      created_at: "",
    };
  }

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        setAgent(agentFromToken(token));
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
    setAgent(agentFromToken(tokens.access_token));
  };

  const register = async (orgName: string, orgSlug: string, email: string, password: string, name: string) => {
    const tokens = await api.post<TokenResponse>("/api/auth/register", {
      org_name: orgName, org_slug: orgSlug, email, password, name,
    });
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    setAgent(agentFromToken(tokens.access_token));
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setAgent(null);
    window.location.href = "/login";
  };

  const updateAgent = (updates: Partial<Agent>) => {
    setAgent((prev) => prev ? { ...prev, ...updates } : prev);
  };

  const uploadAvatar = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/me/avatar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");
    const updated: Agent = await res.json();
    setAgent((prev) => prev ? { ...prev, avatar_url: updated.avatar_url } : prev);
  };

  return (
    <AuthContext value={{ agent, loading, login, register, logout, updateAgent, uploadAvatar }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
