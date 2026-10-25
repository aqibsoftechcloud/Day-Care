"use client";

import { useState } from "react";
import { Plus, ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { MenusTable } from "@/components/admin/menus/MenusTable";
import { MenuFormDialog } from "@/components/admin/menus/MenuFormDialog";
import { MenuViewDialog } from "@/components/admin/menus/MenuViewDialog";
import { DeleteMenuDialog } from "@/components/admin/menus/DeleteMenuDialog";
import { menusKeys } from "@/components/admin/menus/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listMenus } from "@/lib/api/menus";
import type { Menu } from "@/types/menu";

export default function MenusPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("menu-management");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formModal, setFormModal] = useState<
    { mode: "create" } | { mode: "edit"; menuId: number } | null
  >(null);
  const [viewTarget, setViewTarget] = useState<Menu | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Menu | null>(null);

  const menusQuery = useQuery({
    queryKey: menusKeys.all,
    queryFn: () => listMenus(),
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
          You don&apos;t have permission to view Menu Management.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Menu Management"
        description="Manage the navigation menus displayed on the website."
        action={
          canCreate("menu-management") ? (
            <Button onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add Menu
            </Button>
          ) : undefined
        }
      />

      <MenusTable
        menus={menusQuery.data?.menus ?? []}
        loading={menusQuery.isLoading}
        error={
          menusQuery.isError
            ? menusQuery.error instanceof ApiError
              ? menusQuery.error.message
              : "Unable to load menus. Please try again."
            : null
        }
        onRetry={() => menusQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={canUpdate("menu-management")}
        canDelete={canDelete("menu-management")}
        canCreate={canCreate("menu-management")}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onCreate={() => setFormModal({ mode: "create" })}
        onView={(menu) => setViewTarget(menu)}
        onEdit={(menu) => setFormModal({ mode: "edit", menuId: menu.id })}
        onDelete={(menu) => setDeleteTarget(menu)}
      />

      <MenuFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        menuId={formModal?.mode === "edit" ? formModal.menuId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <MenuViewDialog menu={viewTarget} onClose={() => setViewTarget(null)} />

      <DeleteMenuDialog menu={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
