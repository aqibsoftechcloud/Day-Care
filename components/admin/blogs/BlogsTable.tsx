"use client";

import { useMemo } from "react";
import { Eye, Newspaper, Pencil, Plus, Star, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { Blog } from "@/types/blog";
import type { BlogCategory } from "@/types/blog-category";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { FilterDropdown } from "@/components/admin/data-table/FilterDropdown";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";

type BlogsTableProps = {
  blogs: Blog[];
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
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  onCreate: () => void;
  onView: (blog: Blog) => void;
  onEdit: (blog: Blog) => void;
  onDelete: (blog: Blog) => void;
};

export function BlogsTable({
  blogs,
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
  categoryFilter,
  onCategoryFilterChange,
  onCreate,
  onView,
  onEdit,
  onDelete,
}: BlogsTableProps) {
  const columns = useMemo<LegacyColumnDef<Blog>[]>(
    () => [
      {
        id: "blog_title",
        accessorKey: "blog_title",
        header: "Blog",
        cell: ({ row }) => (
          <div className="flex max-w-xs flex-col gap-0.5 py-0.5">
            <span className="flex items-center gap-1.5 truncate text-table-body font-semibold text-foreground">
              {row.original.blog_title}
              {row.original.is_featured && (
                <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" aria-label="Featured" />
              )}
            </span>
            <span className="truncate text-caption">{row.original.seo_url}</span>
          </div>
        ),
      },
      {
        id: "category",
        header: "Category",
        enableSorting: false,
        cell: ({ row }) => <span className="text-body-sm text-foreground">{row.original.category.category_name}</span>,
      },
      {
        id: "city",
        header: "City",
        enableSorting: false,
        cell: ({ row }) => <span className="text-body-sm text-foreground">{row.original.city ? row.original.city.city_name : "Global"}</span>,
      },
      {
        id: "published_date",
        header: "Published",
        cell: ({ row }) => (
          <span className="text-body-sm text-muted-foreground">
            {row.original.published_date ? formatDate(row.original.published_date) : "—"}
          </span>
        ),
      },
      {
        id: "blog_status",
        accessorKey: "blog_status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.blog_status} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const blog = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canView && (
                <TableActionButton icon={Eye} label="View" ariaLabel="View blog" onClick={() => onView(blog)} />
              )}
              {canUpdate && (
                <TableActionButton icon={Pencil} label="Edit" ariaLabel="Edit blog" onClick={() => onEdit(blog)} />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete blog"
                  variant="destructive"
                  onClick={() => onDelete(blog)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [canView, canUpdate, canDelete, onView, onEdit, onDelete]
  );

  const filteredBlogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return blogs.filter((blog) => {
      const matchesSearch =
        !q || blog.blog_title.toLowerCase().includes(q) || blog.seo_url.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || blog.blog_status === statusFilter;
      const matchesCategory = categoryFilter === "all" || String(blog.blog_category_id) === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [blogs, search, statusFilter, categoryFilter]);

  const isFiltering = search.trim() !== "" || statusFilter !== "all" || categoryFilter !== "all";

  return (
    <DataTable
      columns={columns}
      data={filteredBlogs}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(blog) => String(blog.id)}
      emptyIcon={Newspaper}
      emptyTitle={isFiltering ? "No matching blogs" : "No blogs found"}
      emptyDescription={
        isFiltering ? "Try adjusting your search or filters." : "Create your first blog to get started."
      }
      emptyAction={
        !isFiltering && canCreate ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add Blog
          </Button>
        ) : undefined
      }
      toolbar={
        <FilterBar
          filters={
            <>
              <FilterDropdown
                label="Category"
                value={categoryFilter}
                onChange={onCategoryFilterChange}
                options={[
                  { label: "All categories", value: "all" },
                  ...blogCategories.map((category) => ({ label: category.category_name, value: String(category.id) })),
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
          search={<SearchInput value={search} onChange={onSearchChange} placeholder="Search blogs…" />}
        />
      }
    />
  );
}
