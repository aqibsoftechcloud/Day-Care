"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteSpeciality } from "@/lib/api/specialities";
import { notify } from "@/lib/toast";
import { specialitiesKeys } from "@/components/admin/specialities/queries";
import type { Speciality } from "@/types/speciality";

type DeleteSpecialityDialogProps = {
  speciality: Speciality | null;
  onClose: () => void;
};

export function DeleteSpecialityDialog({ speciality, onClose }: DeleteSpecialityDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteSpeciality(id),
    onSuccess: () => {
      notify.success("Speciality deleted successfully.");
      queryClient.invalidateQueries({ queryKey: specialitiesKeys.all });
      onClose();
    },
    onError: (error) => {
      // Surfaced verbatim: the backend returns 409 with a clear message if
      // this speciality still has active child specialities.
      notify.apiError(error, "Failed to delete the speciality.");
    },
  });

  if (!speciality) return null;

  return (
    <DeleteConfirmDialog
      open={!!speciality}
      title="Delete speciality?"
      description={`Are you sure you want to delete "${speciality.speciality_name}"? This deactivates the speciality — it will no longer appear on the website, but the record is kept. Specialities with active child specialities cannot be deleted until those children are reassigned or deactivated first.`}
      confirmLabel="Delete Speciality"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(speciality.id)}
      onCancel={onClose}
    />
  );
}
