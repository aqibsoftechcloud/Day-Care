"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteSpecialityFaq } from "@/lib/api/speciality-faqs";
import { notify } from "@/lib/toast";
import { specialityFaqsKeys } from "@/components/admin/specialities/queries";
import type { SpecialityFaq } from "@/types/speciality-faq";

type DeleteSpecialityFaqDialogProps = {
  faq: SpecialityFaq | null;
  onClose: () => void;
};

export function DeleteSpecialityFaqDialog({ faq, onClose }: DeleteSpecialityFaqDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteSpecialityFaq(id),
    onSuccess: () => {
      notify.success("FAQ deleted successfully.");
      if (faq) {
        queryClient.invalidateQueries({ queryKey: specialityFaqsKeys.bySpeciality(faq.speciality_id) });
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
