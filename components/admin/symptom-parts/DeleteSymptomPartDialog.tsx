"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteSymptomPart } from "@/lib/api/symptom-parts";
import { notify } from "@/lib/toast";
import { symptomPartsKeys } from "@/components/admin/symptom-parts/queries";
import type { SymptomPart } from "@/types/symptom-part";

type DeleteSymptomPartDialogProps = {
  part: SymptomPart | null;
  onClose: () => void;
};

export function DeleteSymptomPartDialog({ part, onClose }: DeleteSymptomPartDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteSymptomPart(id),
    onSuccess: () => {
      notify.success("Part deleted successfully.");
      queryClient.invalidateQueries({ queryKey: symptomPartsKeys.all });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete the part.");
    },
  });

  if (!part) return null;

  return (
    <DeleteConfirmDialog
      open={!!part}
      title="Delete part?"
      description={`Are you sure you want to delete "${part.part_name}"? This deactivates the part — it will no longer appear on the website, but the record is kept. This is refused if the part still has active symptoms or articles.`}
      confirmLabel="Delete Part"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(part.id)}
      onCancel={onClose}
    />
  );
}
