"use client";

import { useMemo } from "react";
import { Eye, Pencil, Plus, Quote, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { Testimonial } from "@/types/testimonial";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { FilterDropdown } from "@/components/admin/data-table/FilterDropdown";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";

type TestimonialsTableProps = {
  testimonials: Testimonial[];
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
  cityFilter: string;
  onCityFilterChange: (value: string) => void;
  cities: { id: number; city_name: string }[];
  onCreate: () => void;
  onView: (testimonial: Testimonial) => void;
  onEdit: (testimonial: Testimonial) => void;
  onDelete: (testimonial: Testimonial) => void;
};

export function TestimonialsTable({
  testimonials,
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
  cityFilter,
  onCityFilterChange,
  cities,
  onCreate,
  onView,
  onEdit,
  onDelete,
}: TestimonialsTableProps) {
  const columns = useMemo<LegacyColumnDef<Testimonial>[]>(
    () => [
      {
        id: "testimonial_name",
        accessorKey: "testimonial_name",
        header: "Testimonial",
        cell: ({ row }) => (
          <div className="flex max-w-xs flex-col gap-0.5 py-0.5">
            <span className="truncate text-table-body font-semibold text-foreground">
              {row.original.testimonial_name}
            </span>
            <span className="truncate text-caption">{row.original.seo_url}</span>
          </div>
        ),
      },
      {
        id: "city_location",
        header: "City / Location",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5 py-0.5 text-body-sm">
            <span className="text-foreground">{row.original.city.city_name}</span>
            <span className="text-caption">{row.original.location ? row.original.location.area : "—"}</span>
          </div>
        ),
      },
      {
        id: "publish_date",
        header: "Published",
        cell: ({ row }) => (
          <span className="text-body-sm text-muted-foreground">
            {row.original.publish_date ? formatDate(row.original.publish_date) : "—"}
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
          const testimonial = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canView && (
                <TableActionButton icon={Eye} label="View" ariaLabel="View testimonial" onClick={() => onView(testimonial)} />
              )}
              {canUpdate && (
                <TableActionButton icon={Pencil} label="Edit" ariaLabel="Edit testimonial" onClick={() => onEdit(testimonial)} />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete testimonial"
                  variant="destructive"
                  onClick={() => onDelete(testimonial)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [canView, canUpdate, canDelete, onView, onEdit, onDelete]
  );

  const filteredTestimonials = useMemo(() => {
    const q = search.trim().toLowerCase();
    return testimonials.filter((testimonial) => {
      const matchesSearch =
        !q ||
        testimonial.testimonial_name.toLowerCase().includes(q) ||
        testimonial.seo_url.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || testimonial.status === statusFilter;
      const matchesCity = cityFilter === "all" || String(testimonial.city_id) === cityFilter;
      return matchesSearch && matchesStatus && matchesCity;
    });
  }, [testimonials, search, statusFilter, cityFilter]);

  const isFiltering = search.trim() !== "" || statusFilter !== "all" || cityFilter !== "all";

  return (
    <DataTable
      columns={columns}
      data={filteredTestimonials}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(testimonial) => String(testimonial.id)}
      emptyIcon={Quote}
      emptyTitle={isFiltering ? "No matching testimonials" : "No testimonials found"}
      emptyDescription={
        isFiltering ? "Try adjusting your search or filters." : "Create your first testimonial to get started."
      }
      emptyAction={
        !isFiltering && canCreate ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add Testimonial
          </Button>
        ) : undefined
      }
      toolbar={
        <FilterBar
          filters={
            <>
              <FilterDropdown
                label="City"
                value={cityFilter}
                onChange={onCityFilterChange}
                options={[
                  { label: "All cities", value: "all" },
                  ...cities.map((city) => ({ label: city.city_name, value: String(city.id) })),
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
          search={<SearchInput value={search} onChange={onSearchChange} placeholder="Search testimonials…" />}
        />
      }
    />
  );
}
