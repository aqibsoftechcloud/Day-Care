"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteEvent } from "@/lib/api/events";
import { notify } from "@/lib/toast";
import { eventsKeys } from "@/components/admin/events/queries";
import type { Event } from "@/types/event";

type DeleteEventDialogProps = {
  event: Event | null;
  onClose: () => void;
};

export function DeleteEventDialog({ event, onClose }: DeleteEventDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteEvent(id),
    onSuccess: () => {
      notify.success("Event deleted successfully.");
      queryClient.invalidateQueries({ queryKey: eventsKeys.all });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete the event.");
    },
  });

  if (!event) return null;

  return (
    <DeleteConfirmDialog
      open={!!event}
      title="Delete event?"
      description={`Are you sure you want to delete "${event.event_name}"? This deactivates the event — it will no longer appear on the website, but the record is kept.`}
      confirmLabel="Delete Event"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(event.id)}
      onCancel={onClose}
    />
  );
}
