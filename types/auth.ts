export type AuthRole = {
  id: number;
  name: string;
};

export type AuthUser = {
  user_id: string;
  name: string;
  email: string;
  status: string;
  role: AuthRole;
  permissions: string[];
};

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";
