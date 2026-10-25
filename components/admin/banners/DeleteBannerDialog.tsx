"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteBanner } from "@/lib/api/banners";
import { notify } from "@/lib/toast";
import { bannersKeys } from "@/components/admin/banners/queries";
import type { Banner } from "@/types/banner";

type DeleteBannerDialogProps = {
  banner: Banner | null;
  onClose: () => void;
};

export function DeleteBannerDialog({ banner, onClose }: DeleteBannerDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteBanner(id),
    onSuccess: () => {
      notify.success("Banner deleted successfully.");
      queryClient.invalidateQueries({ queryKey: bannersKeys.all });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete the banner.");
    },
  });

  if (!banner) return null;

  return (
    <DeleteConfirmDialog
      open={!!banner}
      title="Delete banner?"
      description={`Are you sure you want to delete "${banner.banner_name}"? This deactivates the banner — it will no longer appear on the website, but the record and its images are kept.`}
      confirmLabel="Delete Banner"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(banner.id)}
      onCancel={onClose}
    />
  );
}
