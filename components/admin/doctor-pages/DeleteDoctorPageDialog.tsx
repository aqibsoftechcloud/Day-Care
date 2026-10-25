"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteDoctorPage } from "@/lib/api/doctor-pages";
import { notify } from "@/lib/toast";
import { doctorPagesKeys } from "@/components/admin/doctor-pages/queries";
import type { DoctorPage } from "@/types/doctor-page";

type DeleteDoctorPageDialogProps = {
  doctorPage: DoctorPage | null;
  onClose: () => void;
};

export function DeleteDoctorPageDialog({ doctorPage, onClose }: DeleteDoctorPageDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteDoctorPage(id),
    onSuccess: () => {
      notify.success("Doctor page deleted successfully.");
      queryClient.invalidateQueries({ queryKey: doctorPagesKeys.all });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete the doctor page.");
    },
  });

  if (!doctorPage) return null;

  return (
    <DeleteConfirmDialog
      open={!!doctorPage}
      title="Delete doctor page?"
      description={`Are you sure you want to delete "${doctorPage.pagename}"? This deactivates the page — it will no longer appear on the website, but the record is kept.`}
      confirmLabel="Delete Doctor Page"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(doctorPage.id)}
      onCancel={onClose}
    />
  );
}
