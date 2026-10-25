"use client";

import { useMemo } from "react";
import { Eye, Newspaper, Pencil, Plus, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { NewsMedia } from "@/types/news-media";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { FilterDropdown } from "@/components/admin/data-table/FilterDropdown";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";

type NewsMediaTableProps = {
  newsMedia: NewsMedia[];
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
  onView: (item: NewsMedia) => void;
  onEdit: (item: NewsMedia) => void;
  onDelete: (item: NewsMedia) => void;
};

export function NewsMediaTable({
  newsMedia,
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
}: NewsMediaTableProps) {
  const columns = useMemo<LegacyColumnDef<NewsMedia>[]>(
    () => [
      {
        id: "title",
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <span className="max-w-xs truncate text-table-body font-semibold text-foreground">
            {row.original.title}
          </span>
        ),
      },
      {
        id: "location",
        header: "Location",
        cell: ({ row }) => <span className="text-body-sm text-foreground">{row.original.location || "—"}</span>,
      },
      {
        id: "date",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-body-sm text-muted-foreground">
            {row.original.date ? formatDate(row.original.date) : "—"}
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
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canView && (
                <TableActionButton icon={Eye} label="View" ariaLabel="View news & media item" onClick={() => onView(item)} />
              )}
              {canUpdate && (
                <TableActionButton icon={Pencil} label="Edit" ariaLabel="Edit news & media item" onClick={() => onEdit(item)} />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete news & media item"
                  variant="destructive"
                  onClick={() => onDelete(item)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [canView, canUpdate, canDelete, onView, onEdit, onDelete]
  );

  const filteredNewsMedia = useMemo(() => {
    const q = search.trim().toLowerCase();
    return newsMedia.filter((item) => {
      const matchesSearch =
        !q || item.title.toLowerCase().includes(q) || (item.location ?? "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [newsMedia, search, statusFilter]);

  const isFiltering = search.trim() !== "" || statusFilter !== "all";

  return (
    <DataTable
      columns={columns}
      data={filteredNewsMedia}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(item) => String(item.id)}
      emptyIcon={Newspaper}
      emptyTitle={isFiltering ? "No matching news & media items" : "No news & media items found"}
      emptyDescription={
        isFiltering ? "Try adjusting your search or status filter." : "Create your first news & media item to get started."
      }
      emptyAction={
        !isFiltering && canCreate ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add News & Media
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
          search={<SearchInput value={search} onChange={onSearchChange} placeholder="Search news & media…" />}
        />
      }
    />
  );
}
