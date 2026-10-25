"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteInternationalPatientLead } from "@/lib/api/leads";
import { notify } from "@/lib/toast";
import { leadsKeys } from "@/components/admin/leads/queries";
import type { InternationalPatientLead } from "@/types/lead";

type DeleteInternationalPatientLeadDialogProps = {
  lead: InternationalPatientLead | null;
  onClose: () => void;
};

export function DeleteInternationalPatientLeadDialog({
  lead,
  onClose,
}: DeleteInternationalPatientLeadDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteInternationalPatientLead(id),
    onSuccess: () => {
      notify.success("International patient lead deleted successfully.");
      queryClient.invalidateQueries({ queryKey: leadsKeys.internationalPatients });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete the lead.");
    },
  });

  if (!lead) return null;

  return (
    <DeleteConfirmDialog
      open={!!lead}
      title="Delete lead?"
      description={`Are you sure you want to delete the lead from "${lead.name}"? This deactivates the record — it is kept but marked deleted.`}
      confirmLabel="Delete Lead"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(lead.id)}
      onCancel={onClose}
    />
  );
}
