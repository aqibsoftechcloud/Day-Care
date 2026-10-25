"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteSymptom } from "@/lib/api/symptoms";
import { notify } from "@/lib/toast";
import { symptomsKeys } from "@/components/admin/symptoms/queries";
import type { Symptom } from "@/types/symptom";

type DeleteSymptomDialogProps = {
  symptom: Symptom | null;
  onClose: () => void;
};

export function DeleteSymptomDialog({ symptom, onClose }: DeleteSymptomDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteSymptom(id),
    onSuccess: () => {
      notify.success("Symptom deleted successfully.");
      queryClient.invalidateQueries({ queryKey: symptomsKeys.all });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete the symptom.");
    },
  });

  if (!symptom) return null;

  return (
    <DeleteConfirmDialog
      open={!!symptom}
      title="Delete symptom?"
      description={`Are you sure you want to delete "${symptom.symptom_name}"? This deactivates the symptom — it will no longer appear on the website, but the record is kept. This is refused if the symptom still has active articles.`}
      confirmLabel="Delete Symptom"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(symptom.id)}
      onCancel={onClose}
    />
  );
}
