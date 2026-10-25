"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteLocation } from "@/lib/api/locations";
import { notify } from "@/lib/toast";
import { locationsKeys } from "@/components/admin/locations/queries";
import type { Location } from "@/types/location";

type DeleteLocationDialogProps = {
  location: Location | null;
  onClose: () => void;
};

export function DeleteLocationDialog({ location, onClose }: DeleteLocationDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteLocation(id),
    onSuccess: () => {
      notify.success("Location deleted successfully.");
      queryClient.invalidateQueries({ queryKey: locationsKeys.all });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete the location.");
    },
  });

  if (!location) return null;

  return (
    <DeleteConfirmDialog
      open={!!location}
      title="Delete location?"
      description={`Are you sure you want to delete "${location.area}"? This deactivates the location — it will no longer appear on the website, but the record is kept.`}
      confirmLabel="Delete Location"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(location.id)}
      onCancel={onClose}
    />
  );
}
