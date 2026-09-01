import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { api } from "../api";

interface AuthUser {
  name: string;
  role: "customer" | "admin";
}

interface AuthCtx {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<AuthUser>;
  requestOtp: (phone: string) => Promise<{ message: string; expires_in_minutes: number; debug_otp: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<AuthUser>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem("sf_user");
    return raw ? JSON.parse(raw) : null;
  });

  const persist = (token: string, role: string, name: string) => {
    localStorage.setItem("sf_token", token);
    const u = { name, role: role as "customer" | "admin" };
    localStorage.setItem("sf_user", JSON.stringify(u));
    setUser(u);
    return u;
  };

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post("/api/auth/login", { email, password });
    return persist(data.access_token, data.role, data.name);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, phone?: string) => {
    const { data } = await api.post("/api/auth/register", { name, email, password, phone });
    return persist(data.access_token, data.role, data.name);
  }, []);

  // Phone / OTP login. See backend/app/routers/auth.py — this is a demo stub with
  // no real SMS gateway wired up, so `debug_otp` is echoed back for testing.
  const requestOtp = useCallback(async (phone: string) => {
    const { data } = await api.post("/api/auth/otp/request", { phone });
    return data;
  }, []);

  const verifyOtp = useCallback(async (phone: string, otp: string) => {
    const { data } = await api.post("/api/auth/otp/verify", { phone, otp });
    return persist(data.access_token, data.role, data.name);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("sf_token");
    localStorage.removeItem("sf_user");
    setUser(null);
  }, []);

  return (
    <Ctx.Provider value={{ user, login, register, requestOtp, verifyOtp, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
