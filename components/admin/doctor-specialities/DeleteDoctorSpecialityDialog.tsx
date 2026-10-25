"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteDoctorSpeciality } from "@/lib/api/doctor-specialities";
import { notify } from "@/lib/toast";
import { doctorSpecialitiesKeys } from "@/components/admin/doctor-specialities/queries";
import type { DoctorSpeciality } from "@/types/doctor-speciality";

type DeleteDoctorSpecialityDialogProps = {
  doctorSpeciality: DoctorSpeciality | null;
  onClose: () => void;
};

export function DeleteDoctorSpecialityDialog({ doctorSpeciality, onClose }: DeleteDoctorSpecialityDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteDoctorSpeciality(id),
    onSuccess: () => {
      notify.success("Doctor speciality deleted successfully.");
      queryClient.invalidateQueries({ queryKey: doctorSpecialitiesKeys.all });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete the doctor speciality.");
    },
  });

  if (!doctorSpeciality) return null;

  return (
    <DeleteConfirmDialog
      open={!!doctorSpeciality}
      title="Delete doctor speciality?"
      description={`Are you sure you want to delete "${doctorSpeciality.speciality_name}"? This deactivates the doctor speciality — it will no longer appear on the website, but the record is kept.`}
      confirmLabel="Delete Doctor Speciality"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(doctorSpeciality.id)}
      onCancel={onClose}
    />
  );
}
