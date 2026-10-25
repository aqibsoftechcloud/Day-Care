"use client";

import { useState } from "react";
import { Plus, ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { JsConfigurationsTable } from "@/components/admin/js-configurations/JsConfigurationsTable";
import { JsConfigurationFormDialog } from "@/components/admin/js-configurations/JsConfigurationFormDialog";
import { JsConfigurationViewDialog } from "@/components/admin/js-configurations/JsConfigurationViewDialog";
import { DeleteJsConfigurationDialog } from "@/components/admin/js-configurations/DeleteJsConfigurationDialog";
import { jsConfigurationsKeys } from "@/components/admin/js-configurations/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listJsConfigurations } from "@/lib/api/js-configurations";
import type { JsConfiguration } from "@/types/js-configuration";

export default function JsConfigurationsPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("js-configurations");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [configForFilter, setConfigForFilter] = useState("all");

  const [formModal, setFormModal] = useState<
    { mode: "create" } | { mode: "edit"; jsConfigurationId: number } | null
  >(null);
  const [viewTarget, setViewTarget] = useState<JsConfiguration | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JsConfiguration | null>(null);

  const jsConfigurationsQuery = useQuery({
    queryKey: jsConfigurationsKeys.all,
    queryFn: () => listJsConfigurations(),
    enabled: hasViewAccess,
  });

  if (!hasViewAccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card px-6 py-20 text-center shadow-xs">
        <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShieldOff className="size-5" aria-hidden="true" />
        </span>
        <p className="text-subtitle text-foreground">Access restricted</p>
        <p className="mt-1 max-w-sm text-body-sm text-muted-foreground">
          You don&apos;t have permission to view JS Configurations.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="JS Configurations"
        description="Manage custom JavaScript injected into the website's header or footer."
        action={
          canCreate("js-configurations") && (
            <Button onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add JS Configuration
            </Button>
          )
        }
      />

      <JsConfigurationsTable
        jsConfigurations={jsConfigurationsQuery.data?.jsConfigurations ?? []}
        loading={jsConfigurationsQuery.isLoading}
        error={
          jsConfigurationsQuery.isError
            ? jsConfigurationsQuery.error instanceof ApiError
              ? jsConfigurationsQuery.error.message
              : "Unable to load JS configurations. Please try again."
            : null
        }
        onRetry={() => jsConfigurationsQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={canUpdate("js-configurations")}
        canDelete={canDelete("js-configurations")}
        canCreate={canCreate("js-configurations")}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        configForFilter={configForFilter}
        onConfigForFilterChange={setConfigForFilter}
        onCreate={() => setFormModal({ mode: "create" })}
        onView={(jsConfiguration) => setViewTarget(jsConfiguration)}
        onEdit={(jsConfiguration) => setFormModal({ mode: "edit", jsConfigurationId: jsConfiguration.id })}
        onDelete={(jsConfiguration) => setDeleteTarget(jsConfiguration)}
      />

      <JsConfigurationFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        jsConfigurationId={formModal?.mode === "edit" ? formModal.jsConfigurationId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <JsConfigurationViewDialog jsConfiguration={viewTarget} onClose={() => setViewTarget(null)} />

      <DeleteJsConfigurationDialog jsConfiguration={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
