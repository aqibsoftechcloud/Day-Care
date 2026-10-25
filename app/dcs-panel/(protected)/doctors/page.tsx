"use client";

import { useState } from "react";
import { Plus, ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { DoctorsTable } from "@/components/admin/doctors/DoctorsTable";
import { DoctorFormDialog } from "@/components/admin/doctors/DoctorFormDialog";
import { DoctorViewDialog } from "@/components/admin/doctors/DoctorViewDialog";
import { DeleteDoctorDialog } from "@/components/admin/doctors/DeleteDoctorDialog";
import { DoctorHospitalsMappingDialog } from "@/components/admin/doctors/DoctorHospitalsMappingDialog";
import { DoctorSpecialitiesMappingDialog } from "@/components/admin/doctors/DoctorSpecialitiesMappingDialog";
import { doctorsKeys } from "@/components/admin/doctors/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listDoctors } from "@/lib/api/doctors";
import type { Doctor } from "@/types/doctor";

export default function DoctorsPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("doctors");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formModal, setFormModal] = useState<
    { mode: "create" } | { mode: "edit"; doctorId: number } | null
  >(null);
  const [viewTarget, setViewTarget] = useState<Doctor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Doctor | null>(null);
  const [hospitalsMappingTarget, setHospitalsMappingTarget] = useState<Doctor | null>(null);
  const [specialitiesMappingTarget, setSpecialitiesMappingTarget] = useState<Doctor | null>(null);

  const doctorsQuery = useQuery({
    queryKey: doctorsKeys.all,
    queryFn: () => listDoctors(),
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
          You don&apos;t have permission to view Doctors.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Doctors"
        description="Manage doctors, their hospital mappings, and their speciality mappings."
        action={
          canCreate("doctors") && (
            <Button onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add Doctor
            </Button>
          )
        }
      />

      <DoctorsTable
        doctors={doctorsQuery.data?.doctors ?? []}
        loading={doctorsQuery.isLoading}
        error={
          doctorsQuery.isError
            ? doctorsQuery.error instanceof ApiError
              ? doctorsQuery.error.message
              : "Unable to load doctors. Please try again."
            : null
        }
        onRetry={() => doctorsQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={canUpdate("doctors")}
        canDelete={canDelete("doctors")}
        canCreate={canCreate("doctors")}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onCreate={() => setFormModal({ mode: "create" })}
        onView={(doctor) => setViewTarget(doctor)}
        onEdit={(doctor) => setFormModal({ mode: "edit", doctorId: doctor.id })}
        onDelete={(doctor) => setDeleteTarget(doctor)}
        onManageHospitals={(doctor) => setHospitalsMappingTarget(doctor)}
        onManageSpecialities={(doctor) => setSpecialitiesMappingTarget(doctor)}
      />

      <DoctorFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        doctorId={formModal?.mode === "edit" ? formModal.doctorId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <DoctorViewDialog doctor={viewTarget} onClose={() => setViewTarget(null)} />

      <DeleteDoctorDialog doctor={deleteTarget} onClose={() => setDeleteTarget(null)} />

      <DoctorHospitalsMappingDialog
        doctor={hospitalsMappingTarget}
        onClose={() => setHospitalsMappingTarget(null)}
        canEdit={canUpdate("doctors")}
      />

      <DoctorSpecialitiesMappingDialog
        doctor={specialitiesMappingTarget}
        onClose={() => setSpecialitiesMappingTarget(null)}
        canEdit={canUpdate("doctors")}
      />
    </div>
  );
}
