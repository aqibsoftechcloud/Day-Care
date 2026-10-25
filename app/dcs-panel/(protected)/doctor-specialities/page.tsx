"use client";

import { useState } from "react";
import { Plus, ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { DoctorSpecialitiesTable } from "@/components/admin/doctor-specialities/DoctorSpecialitiesTable";
import { DoctorSpecialityFormDialog } from "@/components/admin/doctor-specialities/DoctorSpecialityFormDialog";
import { DoctorSpecialityViewDialog } from "@/components/admin/doctor-specialities/DoctorSpecialityViewDialog";
import { DeleteDoctorSpecialityDialog } from "@/components/admin/doctor-specialities/DeleteDoctorSpecialityDialog";
import { doctorSpecialitiesKeys } from "@/components/admin/doctor-specialities/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listDoctorSpecialities } from "@/lib/api/doctor-specialities";
import type { DoctorSpeciality } from "@/types/doctor-speciality";

export default function DoctorSpecialitiesPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("doctor-specialities");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formModal, setFormModal] = useState<
    { mode: "create" } | { mode: "edit"; doctorSpecialityId: number } | null
  >(null);
  const [viewTarget, setViewTarget] = useState<DoctorSpeciality | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DoctorSpeciality | null>(null);

  const doctorSpecialitiesQuery = useQuery({
    queryKey: doctorSpecialitiesKeys.all,
    queryFn: () => listDoctorSpecialities(),
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
          You don&apos;t have permission to view Doctor Specialities.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Doctor Specialities"
        description="Manage the catalog of specialities that doctors can be mapped to."
        action={
          canCreate("doctor-specialities") && (
            <Button onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add Doctor Speciality
            </Button>
          )
        }
      />

      <DoctorSpecialitiesTable
        doctorSpecialities={doctorSpecialitiesQuery.data?.doctorSpecialities ?? []}
        loading={doctorSpecialitiesQuery.isLoading}
        error={
          doctorSpecialitiesQuery.isError
            ? doctorSpecialitiesQuery.error instanceof ApiError
              ? doctorSpecialitiesQuery.error.message
              : "Unable to load doctor specialities. Please try again."
            : null
        }
        onRetry={() => doctorSpecialitiesQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={canUpdate("doctor-specialities")}
        canDelete={canDelete("doctor-specialities")}
        canCreate={canCreate("doctor-specialities")}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onCreate={() => setFormModal({ mode: "create" })}
        onView={(doctorSpeciality) => setViewTarget(doctorSpeciality)}
        onEdit={(doctorSpeciality) => setFormModal({ mode: "edit", doctorSpecialityId: doctorSpeciality.id })}
        onDelete={(doctorSpeciality) => setDeleteTarget(doctorSpeciality)}
      />

      <DoctorSpecialityFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        doctorSpecialityId={formModal?.mode === "edit" ? formModal.doctorSpecialityId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <DoctorSpecialityViewDialog doctorSpeciality={viewTarget} onClose={() => setViewTarget(null)} />

      <DeleteDoctorSpecialityDialog doctorSpeciality={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
