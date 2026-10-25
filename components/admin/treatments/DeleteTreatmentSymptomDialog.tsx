"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteTreatmentSymptom } from "@/lib/api/treatment-symptoms";
import { notify } from "@/lib/toast";
import { treatmentSymptomsKeys } from "@/components/admin/treatments/queries";
import type { TreatmentSymptom } from "@/types/treatment-symptom";

type DeleteTreatmentSymptomDialogProps = {
  symptom: TreatmentSymptom | null;
  onClose: () => void;
};

export function DeleteTreatmentSymptomDialog({ symptom, onClose }: DeleteTreatmentSymptomDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteTreatmentSymptom(id),
    onSuccess: () => {
      notify.success("Symptom deleted successfully.");
      if (symptom) {
        queryClient.invalidateQueries({ queryKey: treatmentSymptomsKeys.byTreatment(symptom.treatment_id) });
      }
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
      description={`Are you sure you want to delete "${symptom.name}"? This deactivates the symptom — it will no longer appear on the website, but the record is kept.`}
      confirmLabel="Delete Symptom"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(symptom.id)}
      onCancel={onClose}
    />
  );
}
