"use client";

import { useMemo } from "react";
import { Eye, Image as ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { Gallery } from "@/types/gallery";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { FilterDropdown } from "@/components/admin/data-table/FilterDropdown";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";

type GalleryTableProps = {
  gallery: Gallery[];
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
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  onCreate: () => void;
  onView: (item: Gallery) => void;
  onEdit: (item: Gallery) => void;
  onDelete: (item: Gallery) => void;
};

export function GalleryTable({
  gallery,
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
  typeFilter,
  onTypeFilterChange,
  onCreate,
  onView,
  onEdit,
  onDelete,
}: GalleryTableProps) {
  const columns = useMemo<LegacyColumnDef<Gallery>[]>(
    () => [
      {
        id: "gallery_name",
        accessorKey: "gallery_name",
        header: "Gallery Item",
        cell: ({ row }) => (
          <div className="flex max-w-xs flex-col gap-0.5 py-0.5">
            <span className="truncate text-table-body font-semibold text-foreground">
              {row.original.gallery_name}
            </span>
            <span className="truncate text-caption">{row.original.seo_url}</span>
          </div>
        ),
      },
      {
        id: "gallery_type",
        header: "Type",
        cell: ({ row }) => (
          <span className="text-body-sm capitalize text-foreground">{row.original.gallery_type}</span>
        ),
      },
      {
        id: "gallery_status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.gallery_status} />,
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
          const item = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canView && (
                <TableActionButton icon={Eye} label="View" ariaLabel="View gallery item" onClick={() => onView(item)} />
              )}
              {canUpdate && (
                <TableActionButton icon={Pencil} label="Edit" ariaLabel="Edit gallery item" onClick={() => onEdit(item)} />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete gallery item"
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

  const filteredGallery = useMemo(() => {
    const q = search.trim().toLowerCase();
    return gallery.filter((item) => {
      const matchesSearch =
        !q || item.gallery_name.toLowerCase().includes(q) || item.seo_url.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || item.gallery_status === statusFilter;
      const matchesType = typeFilter === "all" || item.gallery_type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [gallery, search, statusFilter, typeFilter]);

  const isFiltering = search.trim() !== "" || statusFilter !== "all" || typeFilter !== "all";

  return (
    <DataTable
      columns={columns}
      data={filteredGallery}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(item) => String(item.id)}
      emptyIcon={ImageIcon}
      emptyTitle={isFiltering ? "No matching gallery items" : "No gallery items found"}
      emptyDescription={
        isFiltering ? "Try adjusting your search or filters." : "Create your first gallery item to get started."
      }
      emptyAction={
        !isFiltering && canCreate ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add Gallery Item
          </Button>
        ) : undefined
      }
      toolbar={
        <FilterBar
          filters={
            <>
              <FilterDropdown
                label="Type"
                value={typeFilter}
                onChange={onTypeFilterChange}
                options={[
                  { label: "All types", value: "all" },
                  { label: "Image", value: "image" },
                  { label: "Video", value: "video" },
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
          search={<SearchInput value={search} onChange={onSearchChange} placeholder="Search gallery…" />}
        />
      }
    />
  );
}
