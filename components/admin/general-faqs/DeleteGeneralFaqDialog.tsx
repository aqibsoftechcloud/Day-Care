"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteGeneralFaq } from "@/lib/api/general-faqs";
import { notify } from "@/lib/toast";
import { generalFaqsKeys } from "@/components/admin/general-faqs/queries";
import type { GeneralFaq } from "@/types/general-faq";

type DeleteGeneralFaqDialogProps = {
  faq: GeneralFaq | null;
  onClose: () => void;
};

export function DeleteGeneralFaqDialog({ faq, onClose }: DeleteGeneralFaqDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteGeneralFaq(id),
    onSuccess: () => {
      notify.success("FAQ deleted successfully.");
      queryClient.invalidateQueries({ queryKey: generalFaqsKeys.all });
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
      description={`Are you sure you want to delete "${faq.question}"? This deactivates the FAQ — the record is kept.`}
      confirmLabel="Delete FAQ"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(faq.id)}
      onCancel={onClose}
    />
  );
}
