"use client";

import { useMemo } from "react";
import { Eye, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { Page } from "@/types/page";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { FilterDropdown } from "@/components/admin/data-table/FilterDropdown";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";

type PagesTableProps = {
  pages: Page[];
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
  onView: (page: Page) => void;
  onEdit: (page: Page) => void;
  onDelete: (page: Page) => void;
};

export function PagesTable({
  pages,
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
}: PagesTableProps) {
  const columns = useMemo<LegacyColumnDef<Page>[]>(
    () => [
      {
        id: "title",
        accessorKey: "title",
        header: "Page",
        cell: ({ row }) => (
          <div className="flex max-w-xs flex-col gap-0.5 py-0.5">
            <span className="truncate text-table-body font-semibold text-foreground">{row.original.title}</span>
            <span className="truncate text-caption">/{row.original.seo_url}</span>
          </div>
        ),
      },
      {
        id: "category",
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => <span className="text-body-sm text-foreground">{row.original.category}</span>,
      },
      {
        id: "language_city",
        header: "Language / City",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5 py-0.5 text-body-sm">
            <span className="text-foreground">{row.original.language.name}</span>
            <span className="text-caption">{row.original.city ? row.original.city.city_name : "Global"}</span>
          </div>
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
        cell: ({ row }) => {
          const page = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canView && (
                <TableActionButton icon={Eye} label="View" ariaLabel="View page" onClick={() => onView(page)} />
              )}
              {canUpdate && (
                <TableActionButton icon={Pencil} label="Edit" ariaLabel="Edit page" onClick={() => onEdit(page)} />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete page"
                  variant="destructive"
                  onClick={() => onDelete(page)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [canView, canUpdate, canDelete, onView, onEdit, onDelete]
  );

  const filteredPages = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pages.filter((page) => {
      const matchesSearch =
        !q ||
        page.title.toLowerCase().includes(q) ||
        page.seo_url.toLowerCase().includes(q) ||
        page.category.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || page.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [pages, search, statusFilter]);

  const isFiltering = search.trim() !== "" || statusFilter !== "all";

  return (
    <DataTable
      columns={columns}
      data={filteredPages}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(page) => String(page.id)}
      emptyIcon={FileText}
      emptyTitle={isFiltering ? "No matching pages" : "No pages found"}
      emptyDescription={
        isFiltering ? "Try adjusting your search or status filter." : "Create your first page to get started."
      }
      emptyAction={
        !isFiltering && canCreate ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add Page
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
          search={<SearchInput value={search} onChange={onSearchChange} placeholder="Search pages…" />}
        />
      }
    />
  );
}
