"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteCity } from "@/lib/api/cities";
import { notify } from "@/lib/toast";
import { citiesKeys } from "@/components/admin/cities/queries";
import type { City } from "@/types/city";

type DeleteCityDialogProps = {
  city: City | null;
  onClose: () => void;
};

export function DeleteCityDialog({ city, onClose }: DeleteCityDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteCity(id),
    onSuccess: () => {
      notify.success("City deleted successfully.");
      queryClient.invalidateQueries({ queryKey: citiesKeys.all });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete the city.");
    },
  });

  if (!city) return null;

  return (
    <DeleteConfirmDialog
      open={!!city}
      title="Delete city?"
      description={`Are you sure you want to delete "${city.city_name}"? This deactivates the city — it will no longer appear on the website, but the record is kept.`}
      confirmLabel="Delete City"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(city.id)}
      onCancel={onClose}
    />
  );
}
