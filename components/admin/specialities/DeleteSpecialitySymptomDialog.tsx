"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteSpecialitySymptom } from "@/lib/api/speciality-symptoms";
import { notify } from "@/lib/toast";
import { specialitySymptomsKeys } from "@/components/admin/specialities/queries";
import type { SpecialitySymptom } from "@/types/speciality-symptom";

type DeleteSpecialitySymptomDialogProps = {
  symptom: SpecialitySymptom | null;
  onClose: () => void;
};

export function DeleteSpecialitySymptomDialog({ symptom, onClose }: DeleteSpecialitySymptomDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteSpecialitySymptom(id),
    onSuccess: () => {
      notify.success("Symptom deleted successfully.");
      if (symptom) {
        queryClient.invalidateQueries({ queryKey: specialitySymptomsKeys.bySpeciality(symptom.speciality_id) });
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
      description={`Are you sure you want to delete "${symptom.name}"? This deactivates the symptom — it will no longer appear on the website, but the record and its image are kept.`}
      confirmLabel="Delete Symptom"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(symptom.id)}
      onCancel={onClose}
    />
  );
}
