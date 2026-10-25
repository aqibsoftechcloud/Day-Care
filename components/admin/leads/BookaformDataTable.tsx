"use client";

import { useMemo } from "react";
import { Eye, FileText, Pencil, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { BookaformData } from "@/types/lead";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { FilterDropdown } from "@/components/admin/data-table/FilterDropdown";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";

type BookaformDataTableProps = {
  records: BookaformData[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  canView: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onView: (record: BookaformData) => void;
  onEdit: (record: BookaformData) => void;
  onDelete: (record: BookaformData) => void;
};

export function BookaformDataTable({
  records,
  loading,
  error,
  onRetry,
  canView,
  canUpdate,
  canDelete,
  statusFilter,
  onStatusFilterChange,
  search,
  onSearchChange,
  onView,
  onEdit,
  onDelete,
}: BookaformDataTableProps) {
  // "status" is filtered server-side per validators/bookaform.validator.ts's
  // listBookaformDataQuerySchema. "data_from" has no backend filter
  // support, so the search box filters the already-fetched list client-side
  // (same pattern used by the standard CMS CRUD tables).
  const columns = useMemo<LegacyColumnDef<BookaformData>[]>(
    () => [
      {
        id: "data_from",
        accessorKey: "data_from",
        header: "Submitted From",
        cell: ({ row }) => (
          <span className="truncate text-table-body font-medium text-foreground">
            {row.original.data_from}
          </span>
        ),
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
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            {canView && (
              <TableActionButton
                icon={Eye}
                label="View"
                ariaLabel="View submission"
                onClick={() => onView(row.original)}
              />
            )}
            {canUpdate && (
              <TableActionButton
                icon={Pencil}
                label="Edit"
                ariaLabel="Edit submission"
                onClick={() => onEdit(row.original)}
              />
            )}
            {canDelete && (
              <TableActionButton
                icon={Trash2}
                label="Delete"
                ariaLabel="Delete submission"
                variant="destructive"
                onClick={() => onDelete(row.original)}
              />
            )}
          </div>
        ),
      },
    ],
    [canView, canUpdate, canDelete, onView, onEdit, onDelete]
  );

  const isFiltering = statusFilter !== "all" || search.trim() !== "";

  return (
    <DataTable
      columns={columns}
      data={records}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(record) => String(record.id)}
      density="compact"
      showRowNumbers
      emptyIcon={FileText}
      emptyTitle={isFiltering ? "No matching submissions" : "No book-a-form submissions found"}
      emptyDescription={
        isFiltering
          ? "No submissions match your search or filter."
          : "Book-a-Form submissions from the website will appear here."
      }
      toolbar={
        <FilterBar
          filters={
            <FilterDropdown
              label="Status"
              value={statusFilter}
              onChange={onStatusFilterChange}
              options={[
                { label: "All", value: "all" },
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ]}
            />
          }
          search={
            <SearchInput value={search} onChange={onSearchChange} placeholder="Search submitted from…" />
          }
        />
      }
    />
  );
}
