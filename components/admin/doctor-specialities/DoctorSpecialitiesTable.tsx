"use client";

import { useMemo } from "react";
import { Eye, Pencil, Plus, Stethoscope, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { DoctorSpeciality } from "@/types/doctor-speciality";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { FilterDropdown } from "@/components/admin/data-table/FilterDropdown";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";

type DoctorSpecialitiesTableProps = {
  doctorSpecialities: DoctorSpeciality[];
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
  onView: (doctorSpeciality: DoctorSpeciality) => void;
  onEdit: (doctorSpeciality: DoctorSpeciality) => void;
  onDelete: (doctorSpeciality: DoctorSpeciality) => void;
};

export function DoctorSpecialitiesTable({
  doctorSpecialities,
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
}: DoctorSpecialitiesTableProps) {
  const columns = useMemo<LegacyColumnDef<DoctorSpeciality>[]>(
    () => [
      {
        id: "speciality_name",
        accessorKey: "speciality_name",
        header: "Speciality",
        cell: ({ row }) => (
          <div className="flex max-w-xs flex-col gap-0.5 py-0.5">
            <span className="truncate text-table-body font-semibold text-foreground">
              {row.original.speciality_name}
            </span>
            <span className="truncate text-caption">{row.original.seo_url}</span>
          </div>
        ),
      },
      {
        id: "language",
        header: "Language",
        enableSorting: false,
        cell: ({ row }) => <span className="text-body-sm text-foreground">{row.original.language.name}</span>,
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
          const doctorSpeciality = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canView && (
                <TableActionButton
                  icon={Eye}
                  label="View"
                  ariaLabel="View doctor speciality"
                  onClick={() => onView(doctorSpeciality)}
                />
              )}
              {canUpdate && (
                <TableActionButton
                  icon={Pencil}
                  label="Edit"
                  ariaLabel="Edit doctor speciality"
                  onClick={() => onEdit(doctorSpeciality)}
                />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete doctor speciality"
                  variant="destructive"
                  onClick={() => onDelete(doctorSpeciality)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [canView, canUpdate, canDelete, onView, onEdit, onDelete]
  );

  const filteredDoctorSpecialities = useMemo(() => {
    const q = search.trim().toLowerCase();
    return doctorSpecialities.filter((doctorSpeciality) => {
      const matchesSearch =
        !q ||
        doctorSpeciality.speciality_name.toLowerCase().includes(q) ||
        doctorSpeciality.seo_url.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || doctorSpeciality.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [doctorSpecialities, search, statusFilter]);

  const isFiltering = search.trim() !== "" || statusFilter !== "all";

  return (
    <DataTable
      columns={columns}
      data={filteredDoctorSpecialities}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(doctorSpeciality) => String(doctorSpeciality.id)}
      emptyIcon={Stethoscope}
      emptyTitle={isFiltering ? "No matching doctor specialities" : "No doctor specialities found"}
      emptyDescription={
        isFiltering
          ? "Try adjusting your search or status filter."
          : "Create your first doctor speciality to get started."
      }
      emptyAction={
        !isFiltering && canCreate ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add Doctor Speciality
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
          search={<SearchInput value={search} onChange={onSearchChange} placeholder="Search doctor specialities…" />}
        />
      }
    />
  );
}
