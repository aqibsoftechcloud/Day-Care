"use client";

import { useMemo } from "react";
import { Bot, Eye, KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { AIConfiguration } from "@/types/ai-configuration";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";

const PROVIDER_LABELS: Record<AIConfiguration["provider"], string> = {
  openrouter: "OpenRouter",
  gemini: "Gemini",
};

type AIConfigurationsTableProps = {
  configurations: AIConfiguration[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  canView: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canCreate: boolean;
  onCreate: () => void;
  onView: (config: AIConfiguration) => void;
  onEdit: (config: AIConfiguration) => void;
  onDelete: (config: AIConfiguration) => void;
  onActivate: (config: AIConfiguration) => void;
  activatingId: number | null;
};

export function AIConfigurationsTable({
  configurations,
  loading,
  error,
  onRetry,
  canView,
  canUpdate,
  canDelete,
  canCreate,
  onCreate,
  onView,
  onEdit,
  onDelete,
  onActivate,
  activatingId,
}: AIConfigurationsTableProps) {
  const columns = useMemo<LegacyColumnDef<AIConfiguration>[]>(
    () => [
      {
        id: "provider",
        accessorKey: "provider",
        header: "Provider",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5 py-0.5">
            <span className="text-table-body font-semibold text-foreground">
              {PROVIDER_LABELS[row.original.provider]}
            </span>
            <span className="truncate text-caption">{row.original.model}</span>
          </div>
        ),
      },
      {
        id: "base_url",
        accessorKey: "base_url",
        header: "Base URL",
        cell: ({ row }) => (
          <span className="block max-w-3xs truncate text-body-sm text-muted-foreground">{row.original.base_url}</span>
        ),
      },
      {
        id: "api_key",
        header: "API Key",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.has_api_key ? (
            <Badge variant="secondary">
              <KeyRound data-icon="inline-start" aria-hidden="true" />
              Configured
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Not configured
            </Badge>
          ),
      },
      {
        id: "is_active",
        header: "Active Provider",
        enableSorting: false,
        cell: ({ row }) => {
          const config = row.original;
          const disabled =
            !canUpdate ||
            config.is_active ||
            config.status === "inactive" ||
            activatingId !== null;
          const switchEl = (
            <Switch
              checked={config.is_active}
              disabled={disabled}
              onCheckedChange={() => onActivate(config)}
              aria-label={config.is_active ? `${PROVIDER_LABELS[config.provider]} is the active provider` : `Set ${PROVIDER_LABELS[config.provider]} as the active provider`}
            />
          );
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">{switchEl}</span>
              </TooltipTrigger>
              <TooltipContent side="top">
                {config.is_active
                  ? "Currently active — activate another configuration to replace it"
                  : config.status === "inactive"
                    ? "Reactivate this configuration first"
                    : "Set as the active provider"}
              </TooltipContent>
            </Tooltip>
          );
        },
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const config = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canView && (
                <TableActionButton
                  icon={Eye}
                  label="View"
                  ariaLabel="View AI configuration"
                  onClick={() => onView(config)}
                />
              )}
              {canUpdate && (
                <TableActionButton
                  icon={Pencil}
                  label="Edit"
                  ariaLabel="Edit AI configuration"
                  onClick={() => onEdit(config)}
                />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete AI configuration"
                  variant="destructive"
                  onClick={() => onDelete(config)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [canView, canUpdate, canDelete, onView, onEdit, onDelete, onActivate, activatingId]
  );

  return (
    <DataTable
      columns={columns}
      data={configurations}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(config) => String(config.id)}
      emptyIcon={Bot}
      emptyTitle="No AI configurations found"
      emptyDescription="Add a provider configuration to get started."
      emptyAction={
        canCreate ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add Configuration
          </Button>
        ) : undefined
      }
    />
  );
}
