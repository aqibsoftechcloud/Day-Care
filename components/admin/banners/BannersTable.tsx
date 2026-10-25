"use client";

import { useMemo } from "react";
import { Eye, Image as ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { Banner } from "@/types/banner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { FilterDropdown } from "@/components/admin/data-table/FilterDropdown";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";
import { useCityLookup } from "@/components/admin/banners/useCityLookup";

type BannersTableProps = {
  banners: Banner[];
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
  onView: (banner: Banner) => void;
  onEdit: (banner: Banner) => void;
  onDelete: (banner: Banner) => void;
};

export function BannersTable({
  banners,
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
}: BannersTableProps) {
  const { getCityName } = useCityLookup();

  const columns = useMemo<LegacyColumnDef<Banner>[]>(
    () => [
      {
        id: "banner_image",
        header: "Image",
        enableSorting: false,
        cell: ({ row }) => (
          // eslint-disable-next-line @next/next/no-img-element -- small fixed-size thumbnail from local static storage, not worth next/image here.
          <img
            src={row.original.banner_image}
            alt=""
            className="size-10 shrink-0 rounded-md border border-border object-cover"
          />
        ),
      },
      {
        id: "banner_name",
        accessorKey: "banner_name",
        header: "Banner",
        cell: ({ row }) => (
          <div className="flex max-w-xs flex-col gap-0.5 py-0.5">
            <span className="truncate text-table-body font-semibold text-foreground">{row.original.banner_name}</span>
            {row.original.banner_url && (
              <span className="truncate text-caption">{row.original.banner_url}</span>
            )}
          </div>
        ),
      },
      {
        id: "city",
        header: "City",
        enableSorting: false,
        cell: ({ row }) => <span className="text-body-sm text-foreground">{getCityName(row.original.city_id)}</span>,
      },
      {
        id: "sorting_order",
        accessorKey: "sorting_order",
        header: "Order",
        cell: ({ row }) => <span className="text-body-sm text-muted-foreground">{row.original.sorting_order}</span>,
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
          const banner = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canView && (
                <TableActionButton icon={Eye} label="View" ariaLabel="View banner" onClick={() => onView(banner)} />
              )}
              {canUpdate && (
                <TableActionButton
                  icon={Pencil}
                  label="Edit"
                  ariaLabel="Edit banner"
                  onClick={() => onEdit(banner)}
                />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete banner"
                  variant="destructive"
                  onClick={() => onDelete(banner)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [canView, canUpdate, canDelete, onView, onEdit, onDelete, getCityName]
  );

  const filteredBanners = useMemo(() => {
    const q = search.trim().toLowerCase();
    return banners.filter((banner) => {
      const matchesSearch = !q || banner.banner_name.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || banner.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [banners, search, statusFilter]);

  const isFiltering = search.trim() !== "" || statusFilter !== "all";

  return (
    <DataTable
      columns={columns}
      data={filteredBanners}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(banner) => String(banner.id)}
      emptyIcon={ImageIcon}
      emptyTitle={isFiltering ? "No matching banners" : "No banners found"}
      emptyDescription={
        isFiltering ? "Try adjusting your search or status filter." : "Create your first banner to get started."
      }
      emptyAction={
        !isFiltering && canCreate ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add Banner
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
          search={<SearchInput value={search} onChange={onSearchChange} placeholder="Search banners…" />}
        />
      }
    />
  );
}
