"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteHospitalFaq } from "@/lib/api/hospital-faqs";
import { notify } from "@/lib/toast";
import { hospitalFaqsKeys } from "@/components/admin/hospitals/queries";
import type { HospitalFaq } from "@/types/hospital-faq";

type DeleteHospitalFaqDialogProps = {
  faq: HospitalFaq | null;
  onClose: () => void;
};

export function DeleteHospitalFaqDialog({ faq, onClose }: DeleteHospitalFaqDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteHospitalFaq(id),
    onSuccess: () => {
      notify.success("FAQ deleted successfully.");
      if (faq) {
        queryClient.invalidateQueries({ queryKey: hospitalFaqsKeys.byHospital(faq.hospital_id) });
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
