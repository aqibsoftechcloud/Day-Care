"use client";

import { useState } from "react";
import { Plus, ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { HealthPackagesTable } from "@/components/admin/health-packages/HealthPackagesTable";
import { HealthPackageFormDialog } from "@/components/admin/health-packages/HealthPackageFormDialog";
import { HealthPackageViewDialog } from "@/components/admin/health-packages/HealthPackageViewDialog";
import { DeleteHealthPackageDialog } from "@/components/admin/health-packages/DeleteHealthPackageDialog";
import { healthPackagesKeys } from "@/components/admin/health-packages/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listHealthPackages } from "@/lib/api/health-packages";
import type { HealthPackage } from "@/types/health-package";

export default function HealthPackagesPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("packages");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formModal, setFormModal] = useState<
    { mode: "create" } | { mode: "edit"; healthPackageId: number } | null
  >(null);
  const [viewTarget, setViewTarget] = useState<HealthPackage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HealthPackage | null>(null);

  const healthPackagesQuery = useQuery({
    queryKey: healthPackagesKeys.all,
    queryFn: () => listHealthPackages(),
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
          You don&apos;t have permission to view Packages.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Health Check Packages"
        description="Manage the health check packages offered on the website."
        action={
          canCreate("packages") && (
            <Button onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add Package
            </Button>
          )
        }
      />

      <HealthPackagesTable
        healthPackages={healthPackagesQuery.data?.healthPackages ?? []}
        loading={healthPackagesQuery.isLoading}
        error={
          healthPackagesQuery.isError
            ? healthPackagesQuery.error instanceof ApiError
              ? healthPackagesQuery.error.message
              : "Unable to load packages. Please try again."
            : null
        }
        onRetry={() => healthPackagesQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={canUpdate("packages")}
        canDelete={canDelete("packages")}
        canCreate={canCreate("packages")}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onCreate={() => setFormModal({ mode: "create" })}
        onView={(healthPackage) => setViewTarget(healthPackage)}
        onEdit={(healthPackage) => setFormModal({ mode: "edit", healthPackageId: healthPackage.id })}
        onDelete={(healthPackage) => setDeleteTarget(healthPackage)}
      />

      <HealthPackageFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        healthPackageId={formModal?.mode === "edit" ? formModal.healthPackageId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <HealthPackageViewDialog healthPackage={viewTarget} onClose={() => setViewTarget(null)} />

      <DeleteHealthPackageDialog healthPackage={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
