"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteTreatment } from "@/lib/api/treatments";
import { notify } from "@/lib/toast";
import { treatmentsKeys } from "@/components/admin/treatments/queries";
import type { Treatment } from "@/types/treatment";

type DeleteTreatmentDialogProps = {
  treatment: Treatment | null;
  onClose: () => void;
};

export function DeleteTreatmentDialog({ treatment, onClose }: DeleteTreatmentDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteTreatment(id),
    onSuccess: () => {
      notify.success("Treatment deleted successfully.");
      queryClient.invalidateQueries({ queryKey: treatmentsKeys.all });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete the treatment.");
    },
  });

  if (!treatment) return null;

  return (
    <DeleteConfirmDialog
      open={!!treatment}
      title="Delete treatment?"
      description={`Are you sure you want to delete "${treatment.sub_speciality_name}"? This deactivates the treatment — it will no longer appear on the website, but the record is kept.`}
      confirmLabel="Delete Treatment"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(treatment.id)}
      onCancel={onClose}
    />
  );
}
