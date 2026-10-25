"use client";

import { useState } from "react";
import { Plus, ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { SpecialitiesTable } from "@/components/admin/specialities/SpecialitiesTable";
import { SpecialityFormDialog } from "@/components/admin/specialities/SpecialityFormDialog";
import { SpecialityViewDialog } from "@/components/admin/specialities/SpecialityViewDialog";
import { DeleteSpecialityDialog } from "@/components/admin/specialities/DeleteSpecialityDialog";
import { SpecialityFaqsDialog } from "@/components/admin/specialities/SpecialityFaqsDialog";
import { SpecialitySymptomsDialog } from "@/components/admin/specialities/SpecialitySymptomsDialog";
import { specialitiesKeys } from "@/components/admin/specialities/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listSpecialities } from "@/lib/api/specialities";
import type { Speciality } from "@/types/speciality";

export default function SpecialitiesPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("specialities");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formModal, setFormModal] = useState<
    { mode: "create" } | { mode: "edit"; specialityId: number } | null
  >(null);
  const [viewTarget, setViewTarget] = useState<Speciality | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Speciality | null>(null);
  const [faqsTarget, setFaqsTarget] = useState<Speciality | null>(null);
  const [symptomsTarget, setSymptomsTarget] = useState<Speciality | null>(null);

  const specialitiesQuery = useQuery({
    queryKey: specialitiesKeys.all,
    queryFn: () => listSpecialities(),
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
          You don&apos;t have permission to view Specialities.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Specialities"
        description="Manage medical specialities, their FAQs, and their symptoms."
        action={
          canCreate("specialities") ? (
            <Button onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add Speciality
            </Button>
          ) : undefined
        }
      />

      <SpecialitiesTable
        specialities={specialitiesQuery.data?.specialities ?? []}
        loading={specialitiesQuery.isLoading}
        error={
          specialitiesQuery.isError
            ? specialitiesQuery.error instanceof ApiError
              ? specialitiesQuery.error.message
              : "Unable to load specialities. Please try again."
            : null
        }
        onRetry={() => specialitiesQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={canUpdate("specialities")}
        canDelete={canDelete("specialities")}
        canCreate={canCreate("specialities")}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onCreate={() => setFormModal({ mode: "create" })}
        onView={(speciality) => setViewTarget(speciality)}
        onEdit={(speciality) => setFormModal({ mode: "edit", specialityId: speciality.id })}
        onDelete={(speciality) => setDeleteTarget(speciality)}
        onManageFaqs={(speciality) => setFaqsTarget(speciality)}
        onManageSymptoms={(speciality) => setSymptomsTarget(speciality)}
      />

      <SpecialityFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        specialityId={formModal?.mode === "edit" ? formModal.specialityId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <SpecialityViewDialog speciality={viewTarget} onClose={() => setViewTarget(null)} />

      <DeleteSpecialityDialog speciality={deleteTarget} onClose={() => setDeleteTarget(null)} />

      <SpecialityFaqsDialog
        speciality={faqsTarget}
        onClose={() => setFaqsTarget(null)}
        canCreate={canCreate("specialities")}
        canUpdate={canUpdate("specialities")}
        canDelete={canDelete("specialities")}
      />

      <SpecialitySymptomsDialog
        speciality={symptomsTarget}
        onClose={() => setSymptomsTarget(null)}
        canCreate={canCreate("specialities")}
        canUpdate={canUpdate("specialities")}
        canDelete={canDelete("specialities")}
      />
    </div>
  );
}
