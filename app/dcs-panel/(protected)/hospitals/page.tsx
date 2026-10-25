"use client";

import { useState } from "react";
import { HelpCircle, Plus, ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { HospitalsTable } from "@/components/admin/hospitals/HospitalsTable";
import { HospitalFormDialog } from "@/components/admin/hospitals/HospitalFormDialog";
import { HospitalViewDialog } from "@/components/admin/hospitals/HospitalViewDialog";
import { DeleteHospitalDialog } from "@/components/admin/hospitals/DeleteHospitalDialog";
import { HospitalFaqsDialog } from "@/components/admin/hospitals/HospitalFaqsDialog";
import { ManageHospitalFaqsDialog } from "@/components/admin/hospitals/ManageHospitalFaqsDialog";
import { hospitalsKeys } from "@/components/admin/hospitals/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listHospitals } from "@/lib/api/hospitals";
import type { Hospital } from "@/types/hospital";

export default function HospitalsPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("hospitals");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formModal, setFormModal] = useState<
    { mode: "create" } | { mode: "edit"; hospitalId: number } | null
  >(null);
  const [viewTarget, setViewTarget] = useState<Hospital | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Hospital | null>(null);
  const [faqsTarget, setFaqsTarget] = useState<Hospital | null>(null);
  const [manageFaqsOpen, setManageFaqsOpen] = useState(false);

  const hospitalsQuery = useQuery({
    queryKey: hospitalsKeys.all,
    queryFn: () => listHospitals(),
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
          You don&apos;t have permission to view Hospitals.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Hospitals"
        description="Manage hospitals and their FAQs."
        action={
          <>
            <Button variant="outline" onClick={() => setManageFaqsOpen(true)}>
              <HelpCircle className="size-4" aria-hidden="true" />
              Manage FAQs
            </Button>
            {canCreate("hospitals") && (
              <Button onClick={() => setFormModal({ mode: "create" })}>
                <Plus className="size-4" aria-hidden="true" />
                Add Hospital
              </Button>
            )}
          </>
        }
      />

      <HospitalsTable
        hospitals={hospitalsQuery.data?.hospitals ?? []}
        loading={hospitalsQuery.isLoading}
        error={
          hospitalsQuery.isError
            ? hospitalsQuery.error instanceof ApiError
              ? hospitalsQuery.error.message
              : "Unable to load hospitals. Please try again."
            : null
        }
        onRetry={() => hospitalsQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={canUpdate("hospitals")}
        canDelete={canDelete("hospitals")}
        canCreate={canCreate("hospitals")}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onCreate={() => setFormModal({ mode: "create" })}
        onView={(hospital) => setViewTarget(hospital)}
        onEdit={(hospital) => setFormModal({ mode: "edit", hospitalId: hospital.id })}
        onDelete={(hospital) => setDeleteTarget(hospital)}
        onManageFaqs={(hospital) => setFaqsTarget(hospital)}
      />

      <HospitalFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        hospitalId={formModal?.mode === "edit" ? formModal.hospitalId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <HospitalViewDialog hospital={viewTarget} onClose={() => setViewTarget(null)} />

      <DeleteHospitalDialog hospital={deleteTarget} onClose={() => setDeleteTarget(null)} />

      <HospitalFaqsDialog
        hospital={faqsTarget}
        onClose={() => setFaqsTarget(null)}
        canCreate={canCreate("hospitals")}
        canUpdate={canUpdate("hospitals")}
        canDelete={canDelete("hospitals")}
      />

      <ManageHospitalFaqsDialog
        open={manageFaqsOpen}
        onOpenChange={setManageFaqsOpen}
        hospitals={hospitalsQuery.data?.hospitals ?? []}
        canCreate={canCreate("hospitals")}
        canUpdate={canUpdate("hospitals")}
        canDelete={canDelete("hospitals")}
      />
    </div>
  );
}
