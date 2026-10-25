"use client";

import { useState } from "react";
import { Plus, ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { DoctorPagesTable } from "@/components/admin/doctor-pages/DoctorPagesTable";
import { DoctorPageFormDialog } from "@/components/admin/doctor-pages/DoctorPageFormDialog";
import { DoctorPageViewDialog } from "@/components/admin/doctor-pages/DoctorPageViewDialog";
import { DeleteDoctorPageDialog } from "@/components/admin/doctor-pages/DeleteDoctorPageDialog";
import { doctorPagesKeys } from "@/components/admin/doctor-pages/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listDoctorPages } from "@/lib/api/doctor-pages";
import type { DoctorPage } from "@/types/doctor-page";

export default function DoctorPagesPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("doctor-pages");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formModal, setFormModal] = useState<
    { mode: "create" } | { mode: "edit"; doctorPageId: number } | null
  >(null);
  const [viewTarget, setViewTarget] = useState<DoctorPage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DoctorPage | null>(null);

  const doctorPagesQuery = useQuery({
    queryKey: doctorPagesKeys.all,
    queryFn: listDoctorPages,
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
          You don&apos;t have permission to view Doctor Pages.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Doctor Pages"
        description="Manage the doctor-focused landing pages published on the website."
        action={
          canCreate("doctor-pages") ? (
            <Button onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add Doctor Page
            </Button>
          ) : undefined
        }
      />

      <DoctorPagesTable
        doctorPages={doctorPagesQuery.data?.doctorPages ?? []}
        loading={doctorPagesQuery.isLoading}
        error={
          doctorPagesQuery.isError
            ? doctorPagesQuery.error instanceof ApiError
              ? doctorPagesQuery.error.message
              : "Unable to load doctor pages. Please try again."
            : null
        }
        onRetry={() => doctorPagesQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={canUpdate("doctor-pages")}
        canDelete={canDelete("doctor-pages")}
        canCreate={canCreate("doctor-pages")}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onCreate={() => setFormModal({ mode: "create" })}
        onView={(doctorPage) => setViewTarget(doctorPage)}
        onEdit={(doctorPage) => setFormModal({ mode: "edit", doctorPageId: doctorPage.id })}
        onDelete={(doctorPage) => setDeleteTarget(doctorPage)}
      />

      <DoctorPageFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        doctorPageId={formModal?.mode === "edit" ? formModal.doctorPageId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <DoctorPageViewDialog doctorPage={viewTarget} onClose={() => setViewTarget(null)} />

      <DeleteDoctorPageDialog doctorPage={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
