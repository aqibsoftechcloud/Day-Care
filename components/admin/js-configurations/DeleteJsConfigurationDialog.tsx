"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteJsConfiguration } from "@/lib/api/js-configurations";
import { notify } from "@/lib/toast";
import { jsConfigurationsKeys } from "@/components/admin/js-configurations/queries";
import type { JsConfiguration } from "@/types/js-configuration";

type DeleteJsConfigurationDialogProps = {
  jsConfiguration: JsConfiguration | null;
  onClose: () => void;
};

export function DeleteJsConfigurationDialog({ jsConfiguration, onClose }: DeleteJsConfigurationDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteJsConfiguration(id),
    onSuccess: () => {
      notify.success("JS configuration deleted successfully.");
      queryClient.invalidateQueries({ queryKey: jsConfigurationsKeys.all });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete the JS configuration.");
    },
  });

  if (!jsConfiguration) return null;

  return (
    <DeleteConfirmDialog
      open={!!jsConfiguration}
      title="Delete JS configuration?"
      description={`Are you sure you want to delete "${jsConfiguration.config_type}"? This deactivates the configuration — it will no longer be injected on the website, but the record is kept.`}
      confirmLabel="Delete JS Configuration"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(jsConfiguration.id)}
      onCancel={onClose}
    />
  );
}
