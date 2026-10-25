"use client";

import { useMemo } from "react";
import { Building2, Eye, Pencil, Plus, Stethoscope, Trash2, UserRound } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { Doctor } from "@/types/doctor";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { FilterDropdown } from "@/components/admin/data-table/FilterDropdown";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";

type DoctorsTableProps = {
  doctors: Doctor[];
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
  onView: (doctor: Doctor) => void;
  onEdit: (doctor: Doctor) => void;
  onDelete: (doctor: Doctor) => void;
  onManageHospitals: (doctor: Doctor) => void;
  onManageSpecialities: (doctor: Doctor) => void;
};

export function DoctorsTable({
  doctors,
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
  onManageHospitals,
  onManageSpecialities,
}: DoctorsTableProps) {
  const columns = useMemo<LegacyColumnDef<Doctor>[]>(
    () => [
      {
        id: "doctor_name",
        accessorKey: "doctor_name",
        header: "Doctor",
        cell: ({ row }) => (
          <div className="flex max-w-xs flex-col gap-0.5 py-0.5">
            <span className="truncate text-table-body font-semibold text-foreground">
              {row.original.doctor_name}
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
          const doctor = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canView && (
                <TableActionButton
                  icon={Building2}
                  label="Hospitals"
                  ariaLabel="Manage doctor's hospitals"
                  onClick={() => onManageHospitals(doctor)}
                />
              )}
              {canView && (
                <TableActionButton
                  icon={Stethoscope}
                  label="Specialities"
                  ariaLabel="Manage doctor's specialities"
                  onClick={() => onManageSpecialities(doctor)}
                />
              )}
              {canView && (
                <TableActionButton
                  icon={Eye}
                  label="View"
                  ariaLabel="View doctor"
                  onClick={() => onView(doctor)}
                />
              )}
              {canUpdate && (
                <TableActionButton
                  icon={Pencil}
                  label="Edit"
                  ariaLabel="Edit doctor"
                  onClick={() => onEdit(doctor)}
                />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete doctor"
                  variant="destructive"
                  onClick={() => onDelete(doctor)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [canView, canUpdate, canDelete, onView, onEdit, onDelete, onManageHospitals, onManageSpecialities]
  );

  const filteredDoctors = useMemo(() => {
    const q = search.trim().toLowerCase();
    return doctors.filter((doctor) => {
      const matchesSearch =
        !q ||
        doctor.doctor_name.toLowerCase().includes(q) ||
        doctor.seo_url.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || doctor.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [doctors, search, statusFilter]);

  const isFiltering = search.trim() !== "" || statusFilter !== "all";

  return (
    <DataTable
      columns={columns}
      data={filteredDoctors}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(doctor) => String(doctor.id)}
      emptyIcon={UserRound}
      emptyTitle={isFiltering ? "No matching doctors" : "No doctors found"}
      emptyDescription={
        isFiltering
          ? "Try adjusting your search or status filter."
          : "Create your first doctor to get started."
      }
      emptyAction={
        !isFiltering && canCreate ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add Doctor
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
          search={<SearchInput value={search} onChange={onSearchChange} placeholder="Search doctors…" />}
        />
      }
    />
  );
}
