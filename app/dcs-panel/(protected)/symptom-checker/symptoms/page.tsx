"use client";

import { useState } from "react";
import { Plus, ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { SymptomsTable } from "@/components/admin/symptoms/SymptomsTable";
import { SymptomFormDialog } from "@/components/admin/symptoms/SymptomFormDialog";
import { SymptomViewDialog } from "@/components/admin/symptoms/SymptomViewDialog";
import { DeleteSymptomDialog } from "@/components/admin/symptoms/DeleteSymptomDialog";
import { symptomsKeys } from "@/components/admin/symptoms/queries";
import { symptomPartsKeys } from "@/components/admin/symptom-parts/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listSymptoms } from "@/lib/api/symptoms";
import { listSymptomParts } from "@/lib/api/symptom-parts";
import type { Symptom } from "@/types/symptom";

export default function SymptomsPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("symptoms");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [partFilter, setPartFilter] = useState("all");

  const [formModal, setFormModal] = useState<{ mode: "create" } | { mode: "edit"; symptomId: number } | null>(null);
  const [viewTarget, setViewTarget] = useState<Symptom | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Symptom | null>(null);

  const symptomsQuery = useQuery({
    queryKey: symptomsKeys.all,
    queryFn: () => listSymptoms(),
    enabled: hasViewAccess,
  });

  const partsQuery = useQuery({
    queryKey: symptomPartsKeys.all,
    queryFn: () => listSymptomParts(),
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
          You don&apos;t have permission to view Symptoms.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Symptoms"
        description="Manage symptoms mapped to body parts."
        action={
          canCreate("symptoms") && (
            <Button onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add Symptom
            </Button>
          )
        }
      />

      <SymptomsTable
        symptoms={symptomsQuery.data?.symptoms ?? []}
        symptomParts={partsQuery.data?.symptomParts ?? []}
        loading={symptomsQuery.isLoading}
        error={
          symptomsQuery.isError
            ? symptomsQuery.error instanceof ApiError
              ? symptomsQuery.error.message
              : "Unable to load symptoms. Please try again."
            : null
        }
        onRetry={() => symptomsQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={canUpdate("symptoms")}
        canDelete={canDelete("symptoms")}
        canCreate={canCreate("symptoms")}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        partFilter={partFilter}
        onPartFilterChange={setPartFilter}
        onCreate={() => setFormModal({ mode: "create" })}
        onView={(symptom) => setViewTarget(symptom)}
        onEdit={(symptom) => setFormModal({ mode: "edit", symptomId: symptom.id })}
        onDelete={(symptom) => setDeleteTarget(symptom)}
      />

      <SymptomFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        symptomId={formModal?.mode === "edit" ? formModal.symptomId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <SymptomViewDialog symptom={viewTarget} onClose={() => setViewTarget(null)} />

      <DeleteSymptomDialog symptom={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
