"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deletePage } from "@/lib/api/pages";
import { notify } from "@/lib/toast";
import { pagesKeys } from "@/components/admin/pages/queries";
import type { Page } from "@/types/page";

type DeletePageDialogProps = {
  page: Page | null;
  onClose: () => void;
};

export function DeletePageDialog({ page, onClose }: DeletePageDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deletePage(id),
    onSuccess: () => {
      notify.success("Page deleted successfully.");
      queryClient.invalidateQueries({ queryKey: pagesKeys.all });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete the page.");
    },
  });

  if (!page) return null;

  return (
    <DeleteConfirmDialog
      open={!!page}
      title="Delete page?"
      description={`Are you sure you want to delete "${page.title}"? This deactivates the page — it will no longer appear on the website, but the record is kept.`}
      confirmLabel="Delete Page"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(page.id)}
      onCancel={onClose}
    />
  );
}
