"use client";

import { useState } from "react";
import { Plus, ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { GlobalSpecialitiesTable } from "@/components/admin/global-specialities/GlobalSpecialitiesTable";
import { GlobalSpecialityFormDialog } from "@/components/admin/global-specialities/GlobalSpecialityFormDialog";
import { GlobalSpecialityViewDialog } from "@/components/admin/global-specialities/GlobalSpecialityViewDialog";
import { DeleteGlobalSpecialityDialog } from "@/components/admin/global-specialities/DeleteGlobalSpecialityDialog";
import { globalSpecialitiesKeys } from "@/components/admin/global-specialities/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listGlobalSpecialities } from "@/lib/api/global-specialities";
import type { GlobalSpeciality } from "@/types/global-speciality";

export default function GlobalSpecialitiesPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("global-specialities");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formModal, setFormModal] = useState<{ mode: "create" } | { mode: "edit"; globalSpecialityId: number } | null>(null);
  const [viewTarget, setViewTarget] = useState<GlobalSpeciality | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GlobalSpeciality | null>(null);

  const globalSpecialitiesQuery = useQuery({
    queryKey: globalSpecialitiesKeys.all,
    queryFn: () => listGlobalSpecialities(),
    enabled: hasViewAccess,
  });

  if (!hasViewAccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card px-6 py-20 text-center shadow-xs">
        <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShieldOff className="size-5" aria-hidden="true" />
        </span>
        <p className="text-subtitle text-foreground">Access restricted</p>
        <p className="mt-1 max-w-sm text-body-sm text-muted-foreground">You don&apos;t have permission to view Global Specialities.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Global Specialities"
        description="Manage city-independent speciality content shown at /dcg/speciality/{seoUrl}."
        action={
          canCreate("global-specialities") && (
            <Button onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add Global Speciality
            </Button>
          )
        }
      />

      <GlobalSpecialitiesTable
        globalSpecialities={globalSpecialitiesQuery.data?.globalSpecialities ?? []}
        loading={globalSpecialitiesQuery.isLoading}
        error={
          globalSpecialitiesQuery.isError
            ? globalSpecialitiesQuery.error instanceof ApiError
              ? globalSpecialitiesQuery.error.message
              : "Unable to load global specialities. Please try again."
            : null
        }
        onRetry={() => globalSpecialitiesQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={canUpdate("global-specialities")}
        canDelete={canDelete("global-specialities")}
        canCreate={canCreate("global-specialities")}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onCreate={() => setFormModal({ mode: "create" })}
        onView={(globalSpeciality) => setViewTarget(globalSpeciality)}
        onEdit={(globalSpeciality) => setFormModal({ mode: "edit", globalSpecialityId: globalSpeciality.id })}
        onDelete={(globalSpeciality) => setDeleteTarget(globalSpeciality)}
      />

      <GlobalSpecialityFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        globalSpecialityId={formModal?.mode === "edit" ? formModal.globalSpecialityId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <GlobalSpecialityViewDialog globalSpeciality={viewTarget} onClose={() => setViewTarget(null)} />

      <DeleteGlobalSpecialityDialog globalSpeciality={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
