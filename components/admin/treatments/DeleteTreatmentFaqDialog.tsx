"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteTreatmentFaq } from "@/lib/api/treatment-faqs";
import { notify } from "@/lib/toast";
import { treatmentFaqsKeys } from "@/components/admin/treatments/queries";
import type { TreatmentFaq } from "@/types/treatment-faq";

type DeleteTreatmentFaqDialogProps = {
  faq: TreatmentFaq | null;
  onClose: () => void;
};

export function DeleteTreatmentFaqDialog({ faq, onClose }: DeleteTreatmentFaqDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteTreatmentFaq(id),
    onSuccess: () => {
      notify.success("FAQ deleted successfully.");
      if (faq) {
        queryClient.invalidateQueries({ queryKey: treatmentFaqsKeys.byTreatment(faq.treatment_id) });
      }
      onClose();
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete the FAQ.");
    },
  });

  if (!faq) return null;

  return (
    <DeleteConfirmDialog
      open={!!faq}
      title="Delete FAQ?"
      description={`Are you sure you want to delete "${faq.title}"? This deactivates the FAQ — it will no longer appear on the website, but the record is kept.`}
      confirmLabel="Delete FAQ"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(faq.id)}
      onCancel={onClose}
    />
  );
}
