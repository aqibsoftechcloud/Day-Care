"use client";

import { useState } from "react";
import { Plus, ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { UsersTable } from "@/components/admin/users/UsersTable";
import { UserFormDialog } from "@/components/admin/users/UserFormDialog";
import { DeleteUserDialog } from "@/components/admin/users/DeleteUserDialog";
import { UserViewDialog } from "@/components/admin/users/UserViewDialog";
import { usersKeys } from "@/components/admin/users/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listUsers } from "@/lib/api/users";
import type { User } from "@/types/user";

export default function UsersPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("users");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const [formModal, setFormModal] = useState<
    { mode: "create" } | { mode: "edit"; userId: string } | null
  >(null);
  const [viewTarget, setViewTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const usersQuery = useQuery({
    queryKey: usersKeys.all,
    queryFn: listUsers,
    enabled: hasViewAccess,
  });

  if (!hasViewAccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card px-6 py-20 text-center shadow-xs">
        <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShieldOff className="size-5" aria-hidden="true" />
        </span>
        <p className="text-subtitle text-foreground">Access restricted</p>
        <p className="mt-1 max-w-sm text-body-sm text-muted-foreground">
          You don&apos;t have permission to view Users.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Users"
        description="Manage administrator users and their assigned roles."
        action={
          canCreate("users") ? (
            <Button onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add User
            </Button>
          ) : undefined
        }
      />

      <UsersTable
        users={usersQuery.data?.users ?? []}
        loading={usersQuery.isLoading}
        error={
          usersQuery.isError
            ? usersQuery.error instanceof ApiError
              ? usersQuery.error.message
              : "Unable to load users. Please try again."
            : null
        }
        onRetry={() => usersQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={canUpdate("users")}
        canDelete={canDelete("users")}
        canCreate={canCreate("users")}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        onCreate={() => setFormModal({ mode: "create" })}
        onView={(user) => setViewTarget(user)}
        onEdit={(user) => setFormModal({ mode: "edit", userId: user.user_id })}
        onDelete={(user) => setDeleteTarget(user)}
      />

      <UserFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        userId={formModal?.mode === "edit" ? formModal.userId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <UserViewDialog user={viewTarget} onClose={() => setViewTarget(null)} />

      <DeleteUserDialog user={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
