"use client";

import { useState } from "react";
import { Plus, ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { GlobalTreatmentsTable } from "@/components/admin/global-treatments/GlobalTreatmentsTable";
import { GlobalTreatmentFormDialog } from "@/components/admin/global-treatments/GlobalTreatmentFormDialog";
import { GlobalTreatmentViewDialog } from "@/components/admin/global-treatments/GlobalTreatmentViewDialog";
import { DeleteGlobalTreatmentDialog } from "@/components/admin/global-treatments/DeleteGlobalTreatmentDialog";
import { globalTreatmentsKeys } from "@/components/admin/global-treatments/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listGlobalTreatments } from "@/lib/api/global-treatments";
import type { GlobalTreatment } from "@/types/global-treatment";

export default function GlobalTreatmentsPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("global-treatments");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formModal, setFormModal] = useState<{ mode: "create" } | { mode: "edit"; globalTreatmentId: number } | null>(null);
  const [viewTarget, setViewTarget] = useState<GlobalTreatment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GlobalTreatment | null>(null);

  const globalTreatmentsQuery = useQuery({
    queryKey: globalTreatmentsKeys.all,
    queryFn: () => listGlobalTreatments(),
    enabled: hasViewAccess,
  });

  if (!hasViewAccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card px-6 py-20 text-center shadow-xs">
        <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShieldOff className="size-5" aria-hidden="true" />
        </span>
        <p className="text-subtitle text-foreground">Access restricted</p>
        <p className="mt-1 max-w-sm text-body-sm text-muted-foreground">You don&apos;t have permission to view Global Treatments.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Global Treatments"
        description="Manage city-independent treatment content shown at /dcg/treatment/{seoUrl}."
        action={
          canCreate("global-treatments") && (
            <Button onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add Global Treatment
            </Button>
          )
        }
      />

      <GlobalTreatmentsTable
        globalTreatments={globalTreatmentsQuery.data?.globalTreatments ?? []}
        loading={globalTreatmentsQuery.isLoading}
        error={
          globalTreatmentsQuery.isError
            ? globalTreatmentsQuery.error instanceof ApiError
              ? globalTreatmentsQuery.error.message
              : "Unable to load global treatments. Please try again."
            : null
        }
        onRetry={() => globalTreatmentsQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={canUpdate("global-treatments")}
        canDelete={canDelete("global-treatments")}
        canCreate={canCreate("global-treatments")}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onCreate={() => setFormModal({ mode: "create" })}
        onView={(globalTreatment) => setViewTarget(globalTreatment)}
        onEdit={(globalTreatment) => setFormModal({ mode: "edit", globalTreatmentId: globalTreatment.id })}
        onDelete={(globalTreatment) => setDeleteTarget(globalTreatment)}
      />

      <GlobalTreatmentFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        globalTreatmentId={formModal?.mode === "edit" ? formModal.globalTreatmentId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <GlobalTreatmentViewDialog globalTreatment={viewTarget} onClose={() => setViewTarget(null)} />

      <DeleteGlobalTreatmentDialog globalTreatment={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
