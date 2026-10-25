"use client";

import { useState } from "react";
import { Plus, ShieldOff } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { AIConfigurationsTable } from "@/components/admin/ai-configurations/AIConfigurationsTable";
import { AIConfigurationFormDialog } from "@/components/admin/ai-configurations/AIConfigurationFormDialog";
import { AIConfigurationViewDialog } from "@/components/admin/ai-configurations/AIConfigurationViewDialog";
import { DeleteAIConfigurationDialog } from "@/components/admin/ai-configurations/DeleteAIConfigurationDialog";
import { aiConfigurationsKeys } from "@/components/admin/ai-configurations/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { activateAIConfiguration, listAIConfigurations } from "@/lib/api/ai-configurations";
import { notify } from "@/lib/toast";
import type { AIConfiguration } from "@/types/ai-configuration";

export default function AIConfigurationsPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("ai-configurations");
  const queryClient = useQueryClient();

  const [formModal, setFormModal] = useState<
    { mode: "create" } | { mode: "edit"; configId: number } | null
  >(null);
  const [viewTarget, setViewTarget] = useState<AIConfiguration | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AIConfiguration | null>(null);

  const configurationsQuery = useQuery({
    queryKey: aiConfigurationsKeys.all,
    queryFn: listAIConfigurations,
    enabled: hasViewAccess,
  });

  const activateMutation = useMutation({
    mutationFn: (id: number) => activateAIConfiguration(id),
    onSuccess: () => {
      notify.success("Active provider updated.");
      queryClient.invalidateQueries({ queryKey: aiConfigurationsKeys.all });
    },
    onError: (error) => {
      notify.apiError(error, "Failed to activate this configuration.");
    },
  });

  if (!hasViewAccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card px-6 py-20 text-center shadow-xs">
        <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShieldOff className="size-5" aria-hidden="true" />
        </span>
        <p className="text-subtitle text-foreground">Access restricted</p>
        <p className="mt-1 max-w-sm text-body-sm text-muted-foreground">
          You don&apos;t have permission to view AI Configurations.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="AI Configuration"
        description="Manage AI provider connections. The active provider is used wherever AI-assisted content generation is enabled."
        action={
          canCreate("ai-configurations") ? (
            <Button onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add Configuration
            </Button>
          ) : undefined
        }
      />

      <AIConfigurationsTable
        configurations={configurationsQuery.data?.aiConfigurations ?? []}
        loading={configurationsQuery.isLoading}
        error={
          configurationsQuery.isError
            ? configurationsQuery.error instanceof ApiError
              ? configurationsQuery.error.message
              : "Unable to load AI configurations. Please try again."
            : null
        }
        onRetry={() => configurationsQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={canUpdate("ai-configurations")}
        canDelete={canDelete("ai-configurations")}
        canCreate={canCreate("ai-configurations")}
        onCreate={() => setFormModal({ mode: "create" })}
        onView={(config) => setViewTarget(config)}
        onEdit={(config) => setFormModal({ mode: "edit", configId: config.id })}
        onDelete={(config) => setDeleteTarget(config)}
        onActivate={(config) => activateMutation.mutate(config.id)}
        activatingId={activateMutation.isPending ? (activateMutation.variables ?? null) : null}
      />

      <AIConfigurationFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        configId={formModal?.mode === "edit" ? formModal.configId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <AIConfigurationViewDialog config={viewTarget} onClose={() => setViewTarget(null)} />

      <DeleteAIConfigurationDialog config={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
