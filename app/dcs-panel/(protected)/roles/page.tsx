"use client";

import { useState } from "react";
import { Plus, ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { RolesTable } from "@/components/admin/roles/RolesTable";
import { RoleFormDialog } from "@/components/admin/roles/RoleFormDialog";
import { DeleteRoleDialog } from "@/components/admin/roles/DeleteRoleDialog";
import { RolePermissionsDialog } from "@/components/admin/roles/RolePermissionsDialog";
import { rolesKeys } from "@/components/admin/roles/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listRoles } from "@/lib/api/roles";
import type { Role } from "@/types/role";

export default function RolesPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("roles");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formModal, setFormModal] = useState<
    { mode: "create" } | { mode: "edit"; roleId: number } | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [permissionsTarget, setPermissionsTarget] = useState<Role | null>(null);

  const rolesQuery = useQuery({
    queryKey: rolesKeys.all,
    queryFn: listRoles,
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
          You don&apos;t have permission to view Roles &amp; Permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Roles & Permissions"
        description="Manage administrator roles and their access permissions."
        action={
          canCreate("roles") ? (
            <Button onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add Role
            </Button>
          ) : undefined
        }
      />

      <RolesTable
        roles={rolesQuery.data?.roles ?? []}
        loading={rolesQuery.isLoading}
        error={
          rolesQuery.isError
            ? rolesQuery.error instanceof ApiError
              ? rolesQuery.error.message
              : "Unable to load roles. Please try again."
            : null
        }
        onRetry={() => rolesQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={canUpdate("roles")}
        canDelete={canDelete("roles")}
        canCreate={canCreate("roles")}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onCreate={() => setFormModal({ mode: "create" })}
        onEdit={(role) => setFormModal({ mode: "edit", roleId: role.id })}
        onManagePermissions={(role) => setPermissionsTarget(role)}
        onDelete={(role) => setDeleteTarget(role)}
      />

      <RoleFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        roleId={formModal?.mode === "edit" ? formModal.roleId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <DeleteRoleDialog role={deleteTarget} onClose={() => setDeleteTarget(null)} />

      <RolePermissionsDialog
        role={permissionsTarget}
        onClose={() => setPermissionsTarget(null)}
        canEdit={canUpdate("roles")}
      />
    </div>
  );
}
