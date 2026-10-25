"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteAIConfiguration } from "@/lib/api/ai-configurations";
import { notify } from "@/lib/toast";
import { aiConfigurationsKeys } from "@/components/admin/ai-configurations/queries";
import type { AIConfiguration, AIConfigurationProvider } from "@/types/ai-configuration";

const PROVIDER_LABELS: Record<AIConfigurationProvider, string> = {
  openrouter: "OpenRouter",
  gemini: "Gemini",
};

type DeleteAIConfigurationDialogProps = {
  config: AIConfiguration | null;
  onClose: () => void;
};

export function DeleteAIConfigurationDialog({ config, onClose }: DeleteAIConfigurationDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteAIConfiguration(id),
    onSuccess: () => {
      notify.success("AI configuration deleted successfully.");
      queryClient.invalidateQueries({ queryKey: aiConfigurationsKeys.all });
      onClose();
    },
    onError: (error) => {
      // Surfaced verbatim: the backend returns 409 with a clear message if
      // this configuration is currently the active provider.
      notify.apiError(error, "Failed to delete the configuration.");
    },
  });

  if (!config) return null;

  return (
    <DeleteConfirmDialog
      open={!!config}
      title="Delete AI configuration?"
      description={`Are you sure you want to delete this ${PROVIDER_LABELS[config.provider]} configuration? This deactivates it — the record is kept. A configuration that is currently the active provider cannot be deleted until a different one is activated.`}
      confirmLabel="Delete Configuration"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(config.id)}
      onCancel={onClose}
    />
  );
}
