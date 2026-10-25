import { apiFetch } from "./client";
import type { AuthUser } from "@/types/auth";

export type LoginInput = {
  email: string;
  password: string;
};

type LoginResponse = {
  success: true;
  user: Omit<AuthUser, "permissions">;
};

type MeResponse = {
  success: true;
  user: AuthUser;
};

type LogoutResponse = {
  success: true;
  message: string;
};

export function login(input: LoginInput) {
  return apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: input,
  });
}

export function getMe() {
  return apiFetch<MeResponse>("/api/auth/me");
}

export function logout() {
  return apiFetch<LogoutResponse>("/api/auth/logout", { method: "POST" });
}
