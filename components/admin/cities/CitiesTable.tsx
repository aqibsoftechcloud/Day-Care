"use client";

import { useMemo } from "react";
import { Building2, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { City } from "@/types/city";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { FilterDropdown } from "@/components/admin/data-table/FilterDropdown";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { languagesKeys } from "@/components/admin/languages/queries";
import { listLanguages } from "@/lib/api/languages";
import { formatDate } from "@/lib/format-date";

type CitiesTableProps = {
  cities: City[];
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
  onView: (city: City) => void;
  onEdit: (city: City) => void;
  onDelete: (city: City) => void;
};

export function CitiesTable({
  cities,
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
}: CitiesTableProps) {
  // Cities only ever return a raw language_id FK (no nested `language`
  // object — confirmed in services/city.service.ts), so the language
  // name is resolved client-side against the Languages list.
  const languagesQuery = useQuery({ queryKey: languagesKeys.all, queryFn: listLanguages });
  const languageNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const language of languagesQuery.data?.languages ?? []) map.set(language.id, language.name);
    return map;
  }, [languagesQuery.data]);

  const columns = useMemo<LegacyColumnDef<City>[]>(
    () => [
      {
        id: "city_name",
        accessorKey: "city_name",
        header: "City",
        cell: ({ row }) => (
          <div className="flex max-w-xs flex-col gap-0.5 py-0.5">
            <span className="truncate text-table-body font-semibold text-foreground">
              {row.original.city_name}
            </span>
            <span className="truncate text-caption">{row.original.seo_url}</span>
          </div>
        ),
      },
      {
        id: "language",
        accessorKey: "language_id",
        header: "Language",
        cell: ({ row }) => (
          <span className="text-body-sm text-foreground">
            {languageNameById.get(row.original.language_id) ?? `Language #${row.original.language_id}`}
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
          const city = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canView && (
                <TableActionButton icon={Eye} label="View" ariaLabel="View city" onClick={() => onView(city)} />
              )}
              {canUpdate && (
                <TableActionButton icon={Pencil} label="Edit" ariaLabel="Edit city" onClick={() => onEdit(city)} />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete city"
                  variant="destructive"
                  onClick={() => onDelete(city)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [languageNameById, canView, canUpdate, canDelete, onView, onEdit, onDelete]
  );

  const filteredCities = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cities.filter((city) => {
      const matchesSearch =
        !q || city.city_name.toLowerCase().includes(q) || city.seo_url.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || city.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [cities, search, statusFilter]);

  const isFiltering = search.trim() !== "" || statusFilter !== "all";

  return (
    <DataTable
      columns={columns}
      data={filteredCities}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(city) => String(city.id)}
      emptyIcon={Building2}
      emptyTitle={isFiltering ? "No matching cities" : "No cities found"}
      emptyDescription={
        isFiltering
          ? "Try adjusting your search or status filter."
          : "Create your first city to start building out location data."
      }
      emptyAction={
        !isFiltering && canCreate ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add City
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
          search={<SearchInput value={search} onChange={onSearchChange} placeholder="Search cities…" />}
        />
      }
    />
  );
}
