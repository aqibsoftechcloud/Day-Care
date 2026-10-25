"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteNewsMediaItem } from "@/lib/api/news-media";
import { notify } from "@/lib/toast";
import { newsMediaKeys } from "@/components/admin/news-media/queries";
import type { NewsMedia } from "@/types/news-media";

type DeleteNewsMediaDialogProps = {
  newsMediaItem: NewsMedia | null;
  onClose: () => void;
};

export function DeleteNewsMediaDialog({ newsMediaItem, onClose }: DeleteNewsMediaDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteNewsMediaItem(id),
    onSuccess: () => {
      notify.success("News & media item deleted successfully.");
      queryClient.invalidateQueries({ queryKey: newsMediaKeys.all });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete the news & media item.");
    },
  });

  if (!newsMediaItem) return null;

  return (
    <DeleteConfirmDialog
      open={!!newsMediaItem}
      title="Delete news & media item?"
      description={`Are you sure you want to delete "${newsMediaItem.title}"? This deactivates the item — it will no longer appear on the website, but the record is kept.`}
      confirmLabel="Delete News & Media"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(newsMediaItem.id)}
      onCancel={onClose}
    />
  );
}
