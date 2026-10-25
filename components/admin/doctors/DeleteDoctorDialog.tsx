"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteDoctor } from "@/lib/api/doctors";
import { notify } from "@/lib/toast";
import { doctorsKeys } from "@/components/admin/doctors/queries";
import type { Doctor } from "@/types/doctor";

type DeleteDoctorDialogProps = {
  doctor: Doctor | null;
  onClose: () => void;
};

export function DeleteDoctorDialog({ doctor, onClose }: DeleteDoctorDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteDoctor(id),
    onSuccess: () => {
      notify.success("Doctor deleted successfully.");
      queryClient.invalidateQueries({ queryKey: doctorsKeys.all });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete the doctor.");
    },
  });

  if (!doctor) return null;

  return (
    <DeleteConfirmDialog
      open={!!doctor}
      title="Delete doctor?"
      description={`Are you sure you want to delete "${doctor.doctor_name}"? This deactivates the doctor — they will no longer appear on the website, but the record and its mappings are kept.`}
      confirmLabel="Delete Doctor"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(doctor.id)}
      onCancel={onClose}
    />
  );
}
