"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteHealthPackage } from "@/lib/api/health-packages";
import { notify } from "@/lib/toast";
import { healthPackagesKeys } from "@/components/admin/health-packages/queries";
import type { HealthPackage } from "@/types/health-package";

type DeleteHealthPackageDialogProps = {
  healthPackage: HealthPackage | null;
  onClose: () => void;
};

export function DeleteHealthPackageDialog({ healthPackage, onClose }: DeleteHealthPackageDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteHealthPackage(id),
    onSuccess: () => {
      notify.success("Package deleted successfully.");
      queryClient.invalidateQueries({ queryKey: healthPackagesKeys.all });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete the package.");
    },
  });

  if (!healthPackage) return null;

  return (
    <DeleteConfirmDialog
      open={!!healthPackage}
      title="Delete package?"
      description={`Are you sure you want to delete "${healthPackage.package_title}"? This deactivates the package — it will no longer appear on the website, but the record is kept.`}
      confirmLabel="Delete Package"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(healthPackage.id)}
      onCancel={onClose}
    />
  );
}
