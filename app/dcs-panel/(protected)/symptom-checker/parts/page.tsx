"use client";

import { useState } from "react";
import { Plus, ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { SymptomPartsTable } from "@/components/admin/symptom-parts/SymptomPartsTable";
import { SymptomPartFormDialog } from "@/components/admin/symptom-parts/SymptomPartFormDialog";
import { SymptomPartViewDialog } from "@/components/admin/symptom-parts/SymptomPartViewDialog";
import { DeleteSymptomPartDialog } from "@/components/admin/symptom-parts/DeleteSymptomPartDialog";
import { symptomPartsKeys } from "@/components/admin/symptom-parts/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listSymptomParts } from "@/lib/api/symptom-parts";
import type { SymptomPart } from "@/types/symptom-part";

export default function SymptomPartsPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("parts");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formModal, setFormModal] = useState<{ mode: "create" } | { mode: "edit"; partId: number } | null>(null);
  const [viewTarget, setViewTarget] = useState<SymptomPart | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SymptomPart | null>(null);

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
          You don&apos;t have permission to view Parts.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Parts"
        description="Manage the body parts used by the symptom checker."
        action={
          canCreate("parts") && (
            <Button onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add Part
            </Button>
          )
        }
      />

      <SymptomPartsTable
        symptomParts={partsQuery.data?.symptomParts ?? []}
        loading={partsQuery.isLoading}
        error={
          partsQuery.isError
            ? partsQuery.error instanceof ApiError
              ? partsQuery.error.message
              : "Unable to load parts. Please try again."
            : null
        }
        onRetry={() => partsQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={canUpdate("parts")}
        canDelete={canDelete("parts")}
        canCreate={canCreate("parts")}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onCreate={() => setFormModal({ mode: "create" })}
        onView={(part) => setViewTarget(part)}
        onEdit={(part) => setFormModal({ mode: "edit", partId: part.id })}
        onDelete={(part) => setDeleteTarget(part)}
      />

      <SymptomPartFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        partId={formModal?.mode === "edit" ? formModal.partId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <SymptomPartViewDialog part={viewTarget} onClose={() => setViewTarget(null)} />

      <DeleteSymptomPartDialog part={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
