"use client";

import { useMemo, useState } from "react";
import { Activity, Pencil, Plus, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import { useQuery } from "@tanstack/react-query";
import { FormDialog } from "@/components/admin/FormDialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { ApiError } from "@/lib/api/client";
import { listTreatmentSymptoms } from "@/lib/api/treatment-symptoms";
import { treatmentSymptomsKeys } from "@/components/admin/treatments/queries";
import { TreatmentSymptomFormDialog } from "@/components/admin/treatments/TreatmentSymptomFormDialog";
import { DeleteTreatmentSymptomDialog } from "@/components/admin/treatments/DeleteTreatmentSymptomDialog";
import type { TreatmentSymptom } from "@/types/treatment-symptom";
import type { Treatment } from "@/types/treatment";

type TreatmentSymptomsDialogProps = {
  treatment: Treatment | null;
  onClose: () => void;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export function TreatmentSymptomsDialog({ treatment, onClose, canCreate, canUpdate, canDelete }: TreatmentSymptomsDialogProps) {
  return (
    <FormDialog
      open={!!treatment}
      onOpenChange={(open) => !open && onClose()}
      title="Manage Symptoms"
      description={treatment ? `Treatment: ${treatment.sub_speciality_name}` : undefined}
      className="sm:max-w-3xl"
    >
      {treatment && (
        <TreatmentSymptomsBody
          key={treatment.id}
          treatment={treatment}
          canCreate={canCreate}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />
      )}
    </FormDialog>
  );
}

function TreatmentSymptomsBody({
  treatment,
  canCreate,
  canUpdate,
  canDelete,
}: {
  treatment: Treatment;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const [formModal, setFormModal] = useState<{ mode: "create" } | { mode: "edit"; symptomId: number } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TreatmentSymptom | null>(null);

  const symptomsQuery = useQuery({
    queryKey: treatmentSymptomsKeys.byTreatment(treatment.id),
    queryFn: () => listTreatmentSymptoms(treatment.id),
  });

  const symptoms = symptomsQuery.data?.treatmentSymptoms ?? [];

  const columns = useMemo<LegacyColumnDef<TreatmentSymptom>[]>(
    () => [
      {
        id: "image",
        header: "",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- small fixed-size thumbnail from local static storage.
            <img
              src={row.original.image}
              alt=""
              className="size-9 shrink-0 rounded-md border border-border object-cover"
            />
          ) : (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground/40">
              <Activity className="size-4" aria-hidden="true" />
            </span>
          ),
      },
      {
        id: "name",
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => <span className="text-table-body font-semibold text-foreground">{row.original.name}</span>,
      },
      {
        id: "sorting_order",
        accessorKey: "sorting_order",
        header: "Order",
        cell: ({ row }) => <span className="text-body-sm text-muted-foreground">{row.original.sorting_order}</span>,
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const symptom = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canUpdate && (
                <TableActionButton
                  icon={Pencil}
                  label="Edit"
                  ariaLabel="Edit symptom"
                  onClick={() => setFormModal({ mode: "edit", symptomId: symptom.id })}
                />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete symptom"
                  variant="destructive"
                  onClick={() => setDeleteTarget(symptom)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [canUpdate, canDelete]
  );

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-body-sm text-muted-foreground">
            {symptoms.length} {symptoms.length === 1 ? "symptom" : "symptoms"}
          </p>
          {canCreate && (
            <Button size="sm" onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add Symptom
            </Button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={symptoms}
          loading={symptomsQuery.isLoading}
          error={
            symptomsQuery.isError
              ? symptomsQuery.error instanceof ApiError
                ? symptomsQuery.error.message
                : "Unable to load symptoms. Please try again."
              : null
          }
          onRetry={() => symptomsQuery.refetch()}
          getRowId={(symptom) => String(symptom.id)}
          emptyIcon={Activity}
          emptyTitle="No symptoms found"
          emptyDescription="Add the first symptom for this treatment."
          emptyAction={
            canCreate ? (
              <Button size="sm" onClick={() => setFormModal({ mode: "create" })}>
                <Plus className="size-4" aria-hidden="true" />
                Add Symptom
              </Button>
            ) : undefined
          }
        />
      </div>

      <TreatmentSymptomFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        symptomId={formModal?.mode === "edit" ? formModal.symptomId : null}
        treatmentId={treatment.id}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <DeleteTreatmentSymptomDialog symptom={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </>
  );
}
