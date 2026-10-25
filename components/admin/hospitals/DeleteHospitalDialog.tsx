"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteHospital } from "@/lib/api/hospitals";
import { notify } from "@/lib/toast";
import { hospitalsKeys } from "@/components/admin/hospitals/queries";
import type { Hospital } from "@/types/hospital";

type DeleteHospitalDialogProps = {
  hospital: Hospital | null;
  onClose: () => void;
};

export function DeleteHospitalDialog({ hospital, onClose }: DeleteHospitalDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteHospital(id),
    onSuccess: () => {
      notify.success("Hospital deleted successfully.");
      queryClient.invalidateQueries({ queryKey: hospitalsKeys.all });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete the hospital.");
    },
  });

  if (!hospital) return null;

  return (
    <DeleteConfirmDialog
      open={!!hospital}
      title="Delete hospital?"
      description={`Are you sure you want to delete "${hospital.hospital_name}"? This deactivates the hospital — it will no longer appear on the website, but the record is kept.`}
      confirmLabel="Delete Hospital"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(hospital.id)}
      onCancel={onClose}
    />
  );
}
