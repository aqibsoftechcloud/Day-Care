"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteGlobalTreatment } from "@/lib/api/global-treatments";
import { notify } from "@/lib/toast";
import { globalTreatmentsKeys } from "@/components/admin/global-treatments/queries";
import type { GlobalTreatment } from "@/types/global-treatment";

type DeleteGlobalTreatmentDialogProps = {
  globalTreatment: GlobalTreatment | null;
  onClose: () => void;
};

export function DeleteGlobalTreatmentDialog({ globalTreatment, onClose }: DeleteGlobalTreatmentDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteGlobalTreatment(id),
    onSuccess: () => {
      notify.success("Global treatment deleted successfully.");
      queryClient.invalidateQueries({ queryKey: globalTreatmentsKeys.all });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete the global treatment.");
    },
  });

  if (!globalTreatment) return null;

  return (
    <DeleteConfirmDialog
      open={!!globalTreatment}
      title="Delete global treatment?"
      description={`Are you sure you want to delete "${globalTreatment.treatment_name}"? This deactivates it — it will no longer appear at /dcg/${globalTreatment.seo_url}, but the record, its sections and FAQs are kept, and any city treatments linked to it stay linked.`}
      confirmLabel="Delete Global Treatment"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(globalTreatment.id)}
      onCancel={onClose}
    />
  );
}
