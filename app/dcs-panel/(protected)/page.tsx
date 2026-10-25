"use client";

import { useAuth } from "@/hooks/useAuth";

export default function AdminDashboardPage() {
  const { user, permissions } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome back{user ? `, ${user.name}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{user?.role.name}</span>
          {" · "}
          {permissions.length} permission{permissions.length === 1 ? "" : "s"} granted
        </p>
      </div>
    </div>
  );
}
