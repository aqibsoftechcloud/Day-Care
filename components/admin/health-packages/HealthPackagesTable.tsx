"use client";

import { useMemo } from "react";
import { Eye, PackageSearch, Pencil, Plus, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { HealthPackage } from "@/types/health-package";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { FilterDropdown } from "@/components/admin/data-table/FilterDropdown";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";

type HealthPackagesTableProps = {
  healthPackages: HealthPackage[];
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
  onView: (healthPackage: HealthPackage) => void;
  onEdit: (healthPackage: HealthPackage) => void;
  onDelete: (healthPackage: HealthPackage) => void;
};

export function HealthPackagesTable({
  healthPackages,
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
}: HealthPackagesTableProps) {
  const columns = useMemo<LegacyColumnDef<HealthPackage>[]>(
    () => [
      {
        id: "package_title",
        accessorKey: "package_title",
        header: "Package",
        cell: ({ row }) => (
          <div className="flex max-w-xs flex-col gap-0.5 py-0.5">
            <span className="truncate text-table-body font-semibold text-foreground">
              {row.original.package_title}
            </span>
            <span className="truncate text-caption">{row.original.seo_url}</span>
          </div>
        ),
      },
      {
        id: "cost",
        accessorKey: "cost",
        header: "Cost",
        cell: ({ row }) => <span className="text-body-sm text-foreground">{row.original.cost}</span>,
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
          const healthPackage = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canView && (
                <TableActionButton icon={Eye} label="View" ariaLabel="View package" onClick={() => onView(healthPackage)} />
              )}
              {canUpdate && (
                <TableActionButton icon={Pencil} label="Edit" ariaLabel="Edit package" onClick={() => onEdit(healthPackage)} />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete package"
                  variant="destructive"
                  onClick={() => onDelete(healthPackage)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [canView, canUpdate, canDelete, onView, onEdit, onDelete]
  );

  const filteredHealthPackages = useMemo(() => {
    const q = search.trim().toLowerCase();
    return healthPackages.filter((healthPackage) => {
      const matchesSearch =
        !q ||
        healthPackage.package_title.toLowerCase().includes(q) ||
        healthPackage.seo_url.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || healthPackage.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [healthPackages, search, statusFilter]);

  const isFiltering = search.trim() !== "" || statusFilter !== "all";

  return (
    <DataTable
      columns={columns}
      data={filteredHealthPackages}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(healthPackage) => String(healthPackage.id)}
      emptyIcon={PackageSearch}
      emptyTitle={isFiltering ? "No matching packages" : "No packages found"}
      emptyDescription={
        isFiltering ? "Try adjusting your search or status filter." : "Create your first health package to get started."
      }
      emptyAction={
        !isFiltering && canCreate ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add Package
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
          search={<SearchInput value={search} onChange={onSearchChange} placeholder="Search packages…" />}
        />
      }
    />
  );
}
