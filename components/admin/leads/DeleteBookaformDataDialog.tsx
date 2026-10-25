"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteBookaformData } from "@/lib/api/leads";
import { notify } from "@/lib/toast";
import { leadsKeys } from "@/components/admin/leads/queries";
import type { BookaformData } from "@/types/lead";

type DeleteBookaformDataDialogProps = {
  record: BookaformData | null;
  onClose: () => void;
};

export function DeleteBookaformDataDialog({ record, onClose }: DeleteBookaformDataDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteBookaformData(id),
    onSuccess: () => {
      notify.success("Book-a-Form submission deleted successfully.");
      queryClient.invalidateQueries({ queryKey: leadsKeys.bookaform });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete the submission.");
    },
  });

  if (!record) return null;

  return (
    <DeleteConfirmDialog
      open={!!record}
      title="Delete submission?"
      description={`Are you sure you want to delete the submission from "${record.data_from}"? This deactivates the record — it is kept but marked inactive.`}
      confirmLabel="Delete Submission"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(record.id)}
      onCancel={onClose}
    />
  );
}
