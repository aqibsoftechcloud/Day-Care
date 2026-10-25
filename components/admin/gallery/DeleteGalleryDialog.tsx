"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteGalleryItem } from "@/lib/api/gallery";
import { notify } from "@/lib/toast";
import { galleryKeys } from "@/components/admin/gallery/queries";
import type { Gallery } from "@/types/gallery";

type DeleteGalleryDialogProps = {
  galleryItem: Gallery | null;
  onClose: () => void;
};

export function DeleteGalleryDialog({ galleryItem, onClose }: DeleteGalleryDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteGalleryItem(id),
    onSuccess: () => {
      notify.success("Gallery item deleted successfully.");
      queryClient.invalidateQueries({ queryKey: galleryKeys.all });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete the gallery item.");
    },
  });

  if (!galleryItem) return null;

  return (
    <DeleteConfirmDialog
      open={!!galleryItem}
      title="Delete gallery item?"
      description={`Are you sure you want to delete "${galleryItem.gallery_name}"? This deactivates the item — it will no longer appear on the website, but the record is kept.`}
      confirmLabel="Delete Gallery Item"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(galleryItem.id)}
      onCancel={onClose}
    />
  );
}
