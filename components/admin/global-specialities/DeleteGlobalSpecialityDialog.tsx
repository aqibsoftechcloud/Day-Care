"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteGlobalSpeciality } from "@/lib/api/global-specialities";
import { notify } from "@/lib/toast";
import { globalSpecialitiesKeys } from "@/components/admin/global-specialities/queries";
import type { GlobalSpeciality } from "@/types/global-speciality";

type DeleteGlobalSpecialityDialogProps = {
  globalSpeciality: GlobalSpeciality | null;
  onClose: () => void;
};

export function DeleteGlobalSpecialityDialog({ globalSpeciality, onClose }: DeleteGlobalSpecialityDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteGlobalSpeciality(id),
    onSuccess: () => {
      notify.success("Global speciality deleted successfully.");
      queryClient.invalidateQueries({ queryKey: globalSpecialitiesKeys.all });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete the global speciality.");
    },
  });

  if (!globalSpeciality) return null;

  return (
    <DeleteConfirmDialog
      open={!!globalSpeciality}
      title="Delete global speciality?"
      description={`Are you sure you want to delete "${globalSpeciality.speciality_name}"? This deactivates it — it will no longer appear at /dcg/${globalSpeciality.seo_url}, but the record, its sections and FAQs are kept, and any city specialities linked to it stay linked.`}
      confirmLabel="Delete Global Speciality"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(globalSpeciality.id)}
      onCancel={onClose}
    />
  );
}
