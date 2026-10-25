"use client";

import { useState } from "react";
import { HelpCircle, Plus, ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { TreatmentsTable } from "@/components/admin/treatments/TreatmentsTable";
import { TreatmentFormDialog } from "@/components/admin/treatments/TreatmentFormDialog";
import { TreatmentViewDialog } from "@/components/admin/treatments/TreatmentViewDialog";
import { DeleteTreatmentDialog } from "@/components/admin/treatments/DeleteTreatmentDialog";
import { TreatmentFaqsDialog } from "@/components/admin/treatments/TreatmentFaqsDialog";
import { ManageTreatmentFaqsDialog } from "@/components/admin/treatments/ManageTreatmentFaqsDialog";
import { TreatmentSymptomsDialog } from "@/components/admin/treatments/TreatmentSymptomsDialog";
import { treatmentsKeys } from "@/components/admin/treatments/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listTreatments } from "@/lib/api/treatments";
import type { Treatment } from "@/types/treatment";

export default function TreatmentsPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("treatments");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formModal, setFormModal] = useState<
    { mode: "create" } | { mode: "edit"; treatmentId: number } | null
  >(null);
  const [viewTarget, setViewTarget] = useState<Treatment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Treatment | null>(null);
  const [faqsTarget, setFaqsTarget] = useState<Treatment | null>(null);
  const [manageFaqsOpen, setManageFaqsOpen] = useState(false);
  const [symptomsTarget, setSymptomsTarget] = useState<Treatment | null>(null);

  const treatmentsQuery = useQuery({
    queryKey: treatmentsKeys.all,
    queryFn: () => listTreatments(),
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
          You don&apos;t have permission to view Treatments.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Treatments"
        description="Manage treatments, their FAQs, and their symptoms."
        action={
          <>
            <Button variant="outline" onClick={() => setManageFaqsOpen(true)}>
              <HelpCircle className="size-4" aria-hidden="true" />
              Manage FAQs
            </Button>
            {canCreate("treatments") && (
              <Button onClick={() => setFormModal({ mode: "create" })}>
                <Plus className="size-4" aria-hidden="true" />
                Add Treatment
              </Button>
            )}
          </>
        }
      />

      <TreatmentsTable
        treatments={treatmentsQuery.data?.treatments ?? []}
        loading={treatmentsQuery.isLoading}
        error={
          treatmentsQuery.isError
            ? treatmentsQuery.error instanceof ApiError
              ? treatmentsQuery.error.message
              : "Unable to load treatments. Please try again."
            : null
        }
        onRetry={() => treatmentsQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={canUpdate("treatments")}
        canDelete={canDelete("treatments")}
        canCreate={canCreate("treatments")}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onCreate={() => setFormModal({ mode: "create" })}
        onView={(treatment) => setViewTarget(treatment)}
        onEdit={(treatment) => setFormModal({ mode: "edit", treatmentId: treatment.id })}
        onDelete={(treatment) => setDeleteTarget(treatment)}
        onManageFaqs={(treatment) => setFaqsTarget(treatment)}
        onManageSymptoms={(treatment) => setSymptomsTarget(treatment)}
      />

      <TreatmentFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        treatmentId={formModal?.mode === "edit" ? formModal.treatmentId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <TreatmentViewDialog treatment={viewTarget} onClose={() => setViewTarget(null)} />

      <DeleteTreatmentDialog treatment={deleteTarget} onClose={() => setDeleteTarget(null)} />

      <TreatmentFaqsDialog
        treatment={faqsTarget}
        onClose={() => setFaqsTarget(null)}
        canCreate={canCreate("treatments")}
        canUpdate={canUpdate("treatments")}
        canDelete={canDelete("treatments")}
      />

      <ManageTreatmentFaqsDialog
        open={manageFaqsOpen}
        onOpenChange={setManageFaqsOpen}
        treatments={treatmentsQuery.data?.treatments ?? []}
        canCreate={canCreate("treatments")}
        canUpdate={canUpdate("treatments")}
        canDelete={canDelete("treatments")}
      />

      <TreatmentSymptomsDialog
        treatment={symptomsTarget}
        onClose={() => setSymptomsTarget(null)}
        canCreate={canCreate("treatments")}
        canUpdate={canUpdate("treatments")}
        canDelete={canDelete("treatments")}
      />
    </div>
  );
}
