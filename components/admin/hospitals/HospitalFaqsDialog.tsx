"use client";

import { useMemo, useState } from "react";
import { HelpCircle, Pencil, Plus, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import { useQuery } from "@tanstack/react-query";
import { FormDialog } from "@/components/admin/FormDialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { ApiError } from "@/lib/api/client";
import { listHospitalFaqs } from "@/lib/api/hospital-faqs";
import { hospitalFaqsKeys } from "@/components/admin/hospitals/queries";
import { HospitalFaqFormDialog } from "@/components/admin/hospitals/HospitalFaqFormDialog";
import { DeleteHospitalFaqDialog } from "@/components/admin/hospitals/DeleteHospitalFaqDialog";
import type { HospitalFaq } from "@/types/hospital-faq";
import type { Hospital } from "@/types/hospital";

type HospitalFaqsDialogProps = {
  hospital: Hospital | null;
  onClose: () => void;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export function HospitalFaqsDialog({ hospital, onClose, canCreate, canUpdate, canDelete }: HospitalFaqsDialogProps) {
  return (
    <FormDialog
      open={!!hospital}
      onOpenChange={(open) => !open && onClose()}
      title="Manage FAQs"
      description={hospital ? `Hospital: ${hospital.hospital_name}` : undefined}
      className="sm:max-w-3xl"
    >
      {hospital && (
        <HospitalFaqsBody
          key={hospital.id}
          hospital={hospital}
          canCreate={canCreate}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />
      )}
    </FormDialog>
  );
}

/**
 * Exported so ManageHospitalFaqsDialog (the header-level "pick a hospital
 * first" entry point) can reuse the exact same FAQ list/CRUD implementation
 * instead of duplicating it — both entry points render this one component.
 */
export function HospitalFaqsBody({
  hospital,
  canCreate,
  canUpdate,
  canDelete,
}: {
  hospital: Hospital;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const [formModal, setFormModal] = useState<{ mode: "create" } | { mode: "edit"; faqId: number } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HospitalFaq | null>(null);

  const faqsQuery = useQuery({
    queryKey: hospitalFaqsKeys.byHospital(hospital.id),
    queryFn: () => listHospitalFaqs(hospital.id),
  });

  const faqs = faqsQuery.data?.hospitalFaqs ?? [];

  const columns = useMemo<LegacyColumnDef<HospitalFaq>[]>(
    () => [
      {
        id: "title",
        accessorKey: "title",
        header: "Question",
        cell: ({ row }) => (
          <div className="flex max-w-md flex-col gap-0.5 py-0.5">
            <span className="text-table-body font-semibold text-foreground">{row.original.title}</span>
            <span className="line-clamp-2 text-caption">{row.original.text}</span>
          </div>
        ),
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
          const faq = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canUpdate && (
                <TableActionButton
                  icon={Pencil}
                  label="Edit"
                  ariaLabel="Edit FAQ"
                  onClick={() => setFormModal({ mode: "edit", faqId: faq.id })}
                />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete FAQ"
                  variant="destructive"
                  onClick={() => setDeleteTarget(faq)}
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
            {faqs.length} {faqs.length === 1 ? "FAQ" : "FAQs"}
          </p>
          {canCreate && (
            <Button size="sm" onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add FAQ
            </Button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={faqs}
          loading={faqsQuery.isLoading}
          error={
            faqsQuery.isError
              ? faqsQuery.error instanceof ApiError
                ? faqsQuery.error.message
                : "Unable to load FAQs. Please try again."
              : null
          }
          onRetry={() => faqsQuery.refetch()}
          getRowId={(faq) => String(faq.id)}
          emptyIcon={HelpCircle}
          emptyTitle="No FAQs found"
          emptyDescription="Add the first FAQ for this hospital."
          emptyAction={
            canCreate ? (
              <Button size="sm" onClick={() => setFormModal({ mode: "create" })}>
                <Plus className="size-4" aria-hidden="true" />
                Add FAQ
              </Button>
            ) : undefined
          }
        />
      </div>

      <HospitalFaqFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        faqId={formModal?.mode === "edit" ? formModal.faqId : null}
        hospitalId={hospital.id}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <DeleteHospitalFaqDialog faq={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </>
  );
}
