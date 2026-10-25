"use client";

import { useMemo } from "react";
import { Eye, FileStack, Pencil, Plus, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { GlobalTreatment } from "@/types/global-treatment";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { FilterDropdown } from "@/components/admin/data-table/FilterDropdown";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";

type GlobalTreatmentsTableProps = {
  globalTreatments: GlobalTreatment[];
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
  onCreate: () => void;
  onView: (globalTreatment: GlobalTreatment) => void;
  onEdit: (globalTreatment: GlobalTreatment) => void;
  onDelete: (globalTreatment: GlobalTreatment) => void;
};

export function GlobalTreatmentsTable({
  globalTreatments,
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
  onCreate,
  onView,
  onEdit,
  onDelete,
}: GlobalTreatmentsTableProps) {
  const columns = useMemo<LegacyColumnDef<GlobalTreatment>[]>(
    () => [
      {
        id: "treatment_name",
        accessorKey: "treatment_name",
        header: "Name",
        cell: ({ row }) => {
          const path = `/dcg/treatment/${row.original.seo_url}`;
          return (
            <div className="flex max-w-xs flex-col gap-0.5 py-0.5">
              <span className="truncate text-table-body font-semibold text-foreground">{row.original.treatment_name}</span>
              <span className="truncate text-caption">{path}</span>
            </div>
          );
        },
      },
      {
        id: "linkedCityCount",
        header: "Linked Cities",
        cell: ({ row }) => <Badge variant="secondary">{row.original.linkedCityCount}</Badge>,
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "updated_at",
        header: "Updated",
        cell: ({ row }) => <span className="text-body-sm text-muted-foreground">{formatDate(row.original.updated_at)}</span>,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const globalTreatment = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canView && (
                <TableActionButton icon={Eye} label="View" ariaLabel="View global treatment" onClick={() => onView(globalTreatment)} />
              )}
              {canUpdate && (
                <TableActionButton icon={Pencil} label="Edit" ariaLabel="Edit global treatment" onClick={() => onEdit(globalTreatment)} />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete global treatment"
                  variant="destructive"
                  onClick={() => onDelete(globalTreatment)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [canView, canUpdate, canDelete, onView, onEdit, onDelete]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return globalTreatments.filter((item) => {
      const matchesSearch = !q || item.treatment_name.toLowerCase().includes(q) || item.seo_url.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [globalTreatments, search, statusFilter]);

  const isFiltering = search.trim() !== "" || statusFilter !== "all";

  return (
    <DataTable
      columns={columns}
      data={filtered}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(item) => String(item.id)}
      emptyIcon={FileStack}
      emptyTitle={isFiltering ? "No matching global treatments" : "No global treatments found"}
      emptyDescription={isFiltering ? "Try adjusting your search or filters." : "Create your first global treatment to get started."}
      emptyAction={
        !isFiltering && canCreate ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add Global Treatment
          </Button>
        ) : undefined
      }
      toolbar={
        <FilterBar
          filters={
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
          }
          search={<SearchInput value={search} onChange={onSearchChange} placeholder="Search global treatments…" />}
        />
      }
    />
  );
}
