"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteAppointmentLead } from "@/lib/api/leads";
import { notify } from "@/lib/toast";
import { leadsKeys } from "@/components/admin/leads/queries";
import type { AppointmentLead } from "@/types/lead";

type DeleteAppointmentLeadDialogProps = {
  lead: AppointmentLead | null;
  onClose: () => void;
};

export function DeleteAppointmentLeadDialog({ lead, onClose }: DeleteAppointmentLeadDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteAppointmentLead(id),
    onSuccess: () => {
      notify.success("Appointment lead deleted successfully.");
      queryClient.invalidateQueries({ queryKey: leadsKeys.appointments });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete the lead.");
    },
  });

  if (!lead) return null;

  return (
    <DeleteConfirmDialog
      open={!!lead}
      title="Delete lead?"
      description={`Are you sure you want to delete the lead from "${lead.first_name} ${lead.last_name}"? This deactivates the record — it is kept but marked deleted.`}
      confirmLabel="Delete Lead"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(lead.id)}
      onCancel={onClose}
    />
  );
}
