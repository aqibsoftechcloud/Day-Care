"use client";

import { useMemo } from "react";
import { Code2, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { JsConfiguration } from "@/types/js-configuration";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { FilterDropdown } from "@/components/admin/data-table/FilterDropdown";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";

const CONFIG_FOR_LABELS: Record<JsConfiguration["config_for"], string> = {
  header: "Header",
  footer: "Footer",
};

type JsConfigurationsTableProps = {
  jsConfigurations: JsConfiguration[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  canView: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canCreate: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  configForFilter: string;
  onConfigForFilterChange: (value: string) => void;
  onCreate: () => void;
  onView: (jsConfiguration: JsConfiguration) => void;
  onEdit: (jsConfiguration: JsConfiguration) => void;
  onDelete: (jsConfiguration: JsConfiguration) => void;
};

export function JsConfigurationsTable({
  jsConfigurations,
  loading,
  error,
  onRetry,
  canView,
  canUpdate,
  canDelete,
  canCreate,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  configForFilter,
  onConfigForFilterChange,
  onCreate,
  onView,
  onEdit,
  onDelete,
}: JsConfigurationsTableProps) {
  const columns = useMemo<LegacyColumnDef<JsConfiguration>[]>(
    () => [
      {
        id: "config_type",
        accessorKey: "config_type",
        header: "Config Type",
        cell: ({ row }) => (
          <span className="max-w-xs truncate text-table-body font-semibold text-foreground">
            {row.original.config_type}
          </span>
        ),
      },
      {
        id: "config_for",
        header: "Config For",
        cell: ({ row }) => <Badge variant="secondary">{CONFIG_FOR_LABELS[row.original.config_for]}</Badge>,
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "created_at",
        accessorKey: "created_at",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-body-sm text-muted-foreground">{formatDate(row.original.created_at)}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const jsConfiguration = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canView && (
                <TableActionButton
                  icon={Eye}
                  label="View"
                  ariaLabel="View JS configuration"
                  onClick={() => onView(jsConfiguration)}
                />
              )}
              {canUpdate && (
                <TableActionButton
                  icon={Pencil}
                  label="Edit"
                  ariaLabel="Edit JS configuration"
                  onClick={() => onEdit(jsConfiguration)}
                />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete JS configuration"
                  variant="destructive"
                  onClick={() => onDelete(jsConfiguration)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [canView, canUpdate, canDelete, onView, onEdit, onDelete]
  );

  const filteredConfigurations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jsConfigurations.filter((jsConfiguration) => {
      const matchesSearch = !q || jsConfiguration.config_type.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || jsConfiguration.status === statusFilter;
      const matchesConfigFor = configForFilter === "all" || jsConfiguration.config_for === configForFilter;
      return matchesSearch && matchesStatus && matchesConfigFor;
    });
  }, [jsConfigurations, search, statusFilter, configForFilter]);

  const isFiltering = search.trim() !== "" || statusFilter !== "all" || configForFilter !== "all";

  return (
    <DataTable
      columns={columns}
      data={filteredConfigurations}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(jsConfiguration) => String(jsConfiguration.id)}
      emptyIcon={Code2}
      emptyTitle={isFiltering ? "No matching JS configurations" : "No JS configurations found"}
      emptyDescription={
        isFiltering ? "Try adjusting your search or filters." : "Create your first JS configuration to get started."
      }
      emptyAction={
        !isFiltering && canCreate ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add JS Configuration
          </Button>
        ) : undefined
      }
      toolbar={
        <FilterBar
          filters={
            <>
              <FilterDropdown
                label="Config For"
                value={configForFilter}
                onChange={onConfigForFilterChange}
                options={[
                  { label: "All", value: "all" },
                  { label: "Header", value: "header" },
                  { label: "Footer", value: "footer" },
                ]}
              />
              <FilterDropdown
                label="Status"
                value={statusFilter}
                onChange={onStatusFilterChange}
                options={[
                  { label: "All statuses", value: "all" },
                  { label: "Active", value: "active" },
                  { label: "Inactive", value: "inactive" },
                ]}
              />
            </>
          }
          search={<SearchInput value={search} onChange={onSearchChange} placeholder="Search by config type…" />}
        />
      }
    />
  );
}
