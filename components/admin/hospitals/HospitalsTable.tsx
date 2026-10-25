"use client";

import { useMemo } from "react";
import { Building2, Eye, HelpCircle, Pencil, Plus, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { Hospital } from "@/types/hospital";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { FilterDropdown } from "@/components/admin/data-table/FilterDropdown";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";

type HospitalsTableProps = {
  hospitals: Hospital[];
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
  onView: (hospital: Hospital) => void;
  onEdit: (hospital: Hospital) => void;
  onDelete: (hospital: Hospital) => void;
  onManageFaqs: (hospital: Hospital) => void;
};

export function HospitalsTable({
  hospitals,
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
  onManageFaqs,
}: HospitalsTableProps) {
  const columns = useMemo<LegacyColumnDef<Hospital>[]>(
    () => [
      {
        id: "hospital_name",
        accessorKey: "hospital_name",
        header: "Hospital",
        cell: ({ row }) => (
          <div className="flex max-w-xs flex-col gap-0.5 py-0.5">
            <span className="truncate text-table-body font-semibold text-foreground">
              {row.original.hospital_name}
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
            <span className="text-foreground">{row.original.cities.city_name}</span>
            <span className="text-caption">{row.original.locations ? row.original.locations.area : "—"}</span>
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
          const hospital = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canView && (
                <TableActionButton
                  icon={HelpCircle}
                  label="FAQs"
                  ariaLabel="Manage hospital FAQs"
                  onClick={() => onManageFaqs(hospital)}
                />
              )}
              {canView && (
                <TableActionButton
                  icon={Eye}
                  label="View"
                  ariaLabel="View hospital"
                  onClick={() => onView(hospital)}
                />
              )}
              {canUpdate && (
                <TableActionButton
                  icon={Pencil}
                  label="Edit"
                  ariaLabel="Edit hospital"
                  onClick={() => onEdit(hospital)}
                />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete hospital"
                  variant="destructive"
                  onClick={() => onDelete(hospital)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [canView, canUpdate, canDelete, onView, onEdit, onDelete, onManageFaqs]
  );

  const filteredHospitals = useMemo(() => {
    const q = search.trim().toLowerCase();
    return hospitals.filter((hospital) => {
      const matchesSearch =
        !q ||
        hospital.hospital_name.toLowerCase().includes(q) ||
        hospital.seo_url.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || hospital.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [hospitals, search, statusFilter]);

  const isFiltering = search.trim() !== "" || statusFilter !== "all";

  return (
    <DataTable
      columns={columns}
      data={filteredHospitals}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(hospital) => String(hospital.id)}
      emptyIcon={Building2}
      emptyTitle={isFiltering ? "No matching hospitals" : "No hospitals found"}
      emptyDescription={
        isFiltering
          ? "Try adjusting your search or status filter."
          : "Create your first hospital to get started."
      }
      emptyAction={
        !isFiltering && canCreate ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add Hospital
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
          search={<SearchInput value={search} onChange={onSearchChange} placeholder="Search hospitals…" />}
        />
      }
    />
  );
}
