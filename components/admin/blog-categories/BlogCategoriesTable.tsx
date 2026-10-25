"use client";

import { useMemo } from "react";
import { Eye, FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { BlogCategory } from "@/types/blog-category";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { FilterDropdown } from "@/components/admin/data-table/FilterDropdown";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";

type BlogCategoriesTableProps = {
  blogCategories: BlogCategory[];
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
  onView: (blogCategory: BlogCategory) => void;
  onEdit: (blogCategory: BlogCategory) => void;
  onDelete: (blogCategory: BlogCategory) => void;
};

export function BlogCategoriesTable({
  blogCategories,
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
}: BlogCategoriesTableProps) {
  const columns = useMemo<LegacyColumnDef<BlogCategory>[]>(
    () => [
      {
        id: "category_name",
        accessorKey: "category_name",
        header: "Category",
        cell: ({ row }) => (
          <div className="flex max-w-xs flex-col gap-0.5 py-0.5">
            <span className="truncate text-table-body font-semibold text-foreground">
              {row.original.category_name}
            </span>
            <span className="truncate text-caption">{row.original.seo_url}</span>
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
          const blogCategory = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canView && (
                <TableActionButton
                  icon={Eye}
                  label="View"
                  ariaLabel="View blog category"
                  onClick={() => onView(blogCategory)}
                />
              )}
              {canUpdate && (
                <TableActionButton
                  icon={Pencil}
                  label="Edit"
                  ariaLabel="Edit blog category"
                  onClick={() => onEdit(blogCategory)}
                />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete blog category"
                  variant="destructive"
                  onClick={() => onDelete(blogCategory)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [canView, canUpdate, canDelete, onView, onEdit, onDelete]
  );

  const filteredBlogCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    return blogCategories.filter((blogCategory) => {
      const matchesSearch =
        !q ||
        blogCategory.category_name.toLowerCase().includes(q) ||
        blogCategory.seo_url.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || blogCategory.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [blogCategories, search, statusFilter]);

  const isFiltering = search.trim() !== "" || statusFilter !== "all";

  return (
    <DataTable
      columns={columns}
      data={filteredBlogCategories}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(blogCategory) => String(blogCategory.id)}
      emptyIcon={FolderOpen}
      emptyTitle={isFiltering ? "No matching blog categories" : "No blog categories found"}
      emptyDescription={
        isFiltering
          ? "Try adjusting your search or status filter."
          : "Create your first blog category to get started."
      }
      emptyAction={
        !isFiltering && canCreate ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add Blog Category
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
          search={<SearchInput value={search} onChange={onSearchChange} placeholder="Search blog categories…" />}
        />
      }
    />
  );
}
