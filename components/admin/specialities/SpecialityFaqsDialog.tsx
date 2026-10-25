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
import { listSpecialityFaqs } from "@/lib/api/speciality-faqs";
import { specialityFaqsKeys } from "@/components/admin/specialities/queries";
import { SpecialityFaqFormDialog } from "@/components/admin/specialities/SpecialityFaqFormDialog";
import { DeleteSpecialityFaqDialog } from "@/components/admin/specialities/DeleteSpecialityFaqDialog";
import type { SpecialityFaq } from "@/types/speciality-faq";
import type { Speciality } from "@/types/speciality";

type SpecialityFaqsDialogProps = {
  speciality: Speciality | null;
  onClose: () => void;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export function SpecialityFaqsDialog({ speciality, onClose, canCreate, canUpdate, canDelete }: SpecialityFaqsDialogProps) {
  return (
    <FormDialog
      open={!!speciality}
      onOpenChange={(open) => !open && onClose()}
      title="Manage FAQs"
      description={speciality ? `Speciality: ${speciality.speciality_name}` : undefined}
      className="sm:max-w-3xl"
    >
      {speciality && (
        <SpecialityFaqsBody
          key={speciality.id}
          speciality={speciality}
          canCreate={canCreate}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />
      )}
    </FormDialog>
  );
}

function SpecialityFaqsBody({
  speciality,
  canCreate,
  canUpdate,
  canDelete,
}: {
  speciality: Speciality;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const [formModal, setFormModal] = useState<{ mode: "create" } | { mode: "edit"; faqId: number } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SpecialityFaq | null>(null);

  const faqsQuery = useQuery({
    queryKey: specialityFaqsKeys.bySpeciality(speciality.id),
    queryFn: () => listSpecialityFaqs(speciality.id),
  });

  const faqs = faqsQuery.data?.specialityFaqs ?? [];

  const columns = useMemo<LegacyColumnDef<SpecialityFaq>[]>(
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
          emptyDescription="Add the first FAQ for this speciality."
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

      <SpecialityFaqFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        faqId={formModal?.mode === "edit" ? formModal.faqId : null}
        specialityId={speciality.id}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <DeleteSpecialityFaqDialog faq={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </>
  );
}
