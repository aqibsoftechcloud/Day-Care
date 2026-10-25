"use client";

import { useMemo } from "react";
import { Eye, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { Location } from "@/types/location";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { FilterDropdown } from "@/components/admin/data-table/FilterDropdown";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { citiesKeys } from "@/components/admin/cities/queries";
import { listCities } from "@/lib/api/cities";
import { formatDate } from "@/lib/format-date";

type LocationsTableProps = {
  locations: Location[];
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
  onCreate: () => void;
  onView: (location: Location) => void;
  onEdit: (location: Location) => void;
  onDelete: (location: Location) => void;
};

export function LocationsTable({
  locations,
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
  onCreate,
  onView,
  onEdit,
  onDelete,
}: LocationsTableProps) {
  // Locations only ever return a raw city_id FK (no nested `city` object
  // — confirmed in services/location.service.ts), so the city name is
  // resolved client-side against the Cities list.
  const citiesQuery = useQuery({ queryKey: citiesKeys.all, queryFn: listCities });
  const cities = useMemo(() => citiesQuery.data?.cities ?? [], [citiesQuery.data]);
  const cityNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const city of cities) map.set(city.id, city.city_name);
    return map;
  }, [cities]);

  const columns = useMemo<LegacyColumnDef<Location>[]>(
    () => [
      {
        id: "area",
        accessorKey: "area",
        header: "Location",
        cell: ({ row }) => (
          <div className="flex max-w-xs flex-col gap-0.5 py-0.5">
            <span className="truncate text-table-body font-semibold text-foreground">
              {row.original.area}
            </span>
            <span className="truncate text-caption">{row.original.zipcode}</span>
          </div>
        ),
      },
      {
        id: "city",
        accessorKey: "city_id",
        header: "City",
        cell: ({ row }) => (
          <span className="text-body-sm text-foreground">
            {cityNameById.get(row.original.city_id) ?? `City #${row.original.city_id}`}
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
        id: "updated_at",
        accessorKey: "updated_at",
        header: "Updated",
        cell: ({ row }) => (
          <span className="text-body-sm text-muted-foreground">{formatDate(row.original.updated_at)}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const location = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canView && (
                <TableActionButton
                  icon={Eye}
                  label="View"
                  ariaLabel="View location"
                  onClick={() => onView(location)}
                />
              )}
              {canUpdate && (
                <TableActionButton
                  icon={Pencil}
                  label="Edit"
                  ariaLabel="Edit location"
                  onClick={() => onEdit(location)}
                />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete location"
                  variant="destructive"
                  onClick={() => onDelete(location)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [cityNameById, canView, canUpdate, canDelete, onView, onEdit, onDelete]
  );

  const filteredLocations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return locations.filter((location) => {
      const matchesSearch =
        !q || location.area.toLowerCase().includes(q) || location.zipcode.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || location.status === statusFilter;
      const matchesCity = cityFilter === "all" || String(location.city_id) === cityFilter;
      return matchesSearch && matchesStatus && matchesCity;
    });
  }, [locations, search, statusFilter, cityFilter]);

  const isFiltering = search.trim() !== "" || statusFilter !== "all" || cityFilter !== "all";

  const cityOptions = useMemo(
    () => [
      { label: "All cities", value: "all" },
      ...cities.map((city) => ({ label: city.city_name, value: String(city.id) })),
    ],
    [cities]
  );

  return (
    <DataTable
      columns={columns}
      data={filteredLocations}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(location) => String(location.id)}
      emptyIcon={MapPin}
      emptyTitle={isFiltering ? "No matching locations" : "No locations found"}
      emptyDescription={
        isFiltering
          ? "Try adjusting your search or filters."
          : "Create your first location to associate it with a city."
      }
      emptyAction={
        !isFiltering && canCreate ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add Location
          </Button>
        ) : undefined
      }
      toolbar={
        <FilterBar
          filters={
            <>
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
              <FilterDropdown label="City" value={cityFilter} onChange={onCityFilterChange} options={cityOptions} />
            </>
          }
          search={<SearchInput value={search} onChange={onSearchChange} placeholder="Search locations…" />}
        />
      }
    />
  );
}
