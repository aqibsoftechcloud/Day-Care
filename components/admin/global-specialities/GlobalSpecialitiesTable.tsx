"use client";

import { useMemo } from "react";
import { Eye, FileStack, Pencil, Plus, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { GlobalSpeciality } from "@/types/global-speciality";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { FilterDropdown } from "@/components/admin/data-table/FilterDropdown";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";

type GlobalSpecialitiesTableProps = {
  globalSpecialities: GlobalSpeciality[];
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
  onView: (globalSpeciality: GlobalSpeciality) => void;
  onEdit: (globalSpeciality: GlobalSpeciality) => void;
  onDelete: (globalSpeciality: GlobalSpeciality) => void;
};

export function GlobalSpecialitiesTable({
  globalSpecialities,
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
}: GlobalSpecialitiesTableProps) {
  const columns = useMemo<LegacyColumnDef<GlobalSpeciality>[]>(
    () => [
      {
        id: "speciality_name",
        accessorKey: "speciality_name",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex max-w-xs flex-col gap-0.5 py-0.5">
            <span className="truncate text-table-body font-semibold text-foreground">{row.original.speciality_name}</span>
            <span className="truncate text-caption">/dcg/speciality/{row.original.seo_url}</span>
          </div>
        ),
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
          const globalSpeciality = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canView && (
                <TableActionButton icon={Eye} label="View" ariaLabel="View global speciality" onClick={() => onView(globalSpeciality)} />
              )}
              {canUpdate && (
                <TableActionButton icon={Pencil} label="Edit" ariaLabel="Edit global speciality" onClick={() => onEdit(globalSpeciality)} />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete global speciality"
                  variant="destructive"
                  onClick={() => onDelete(globalSpeciality)}
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
    return globalSpecialities.filter((item) => {
      const matchesSearch = !q || item.speciality_name.toLowerCase().includes(q) || item.seo_url.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [globalSpecialities, search, statusFilter]);

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
      emptyTitle={isFiltering ? "No matching global specialities" : "No global specialities found"}
      emptyDescription={isFiltering ? "Try adjusting your search or filters." : "Create your first global speciality to get started."}
      emptyAction={
        !isFiltering && canCreate ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add Global Speciality
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
          search={<SearchInput value={search} onChange={onSearchChange} placeholder="Search global specialities…" />}
        />
      }
    />
  );
}
