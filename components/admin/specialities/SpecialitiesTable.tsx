"use client";

import { useMemo } from "react";
import { Activity, Eye, HelpCircle, Pencil, Plus, Stethoscope, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { Speciality } from "@/types/speciality";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { FilterDropdown } from "@/components/admin/data-table/FilterDropdown";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";

type SpecialitiesTableProps = {
  specialities: Speciality[];
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
  onView: (speciality: Speciality) => void;
  onEdit: (speciality: Speciality) => void;
  onDelete: (speciality: Speciality) => void;
  onManageFaqs: (speciality: Speciality) => void;
  onManageSymptoms: (speciality: Speciality) => void;
};

export function SpecialitiesTable({
  specialities,
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
  onManageSymptoms,
}: SpecialitiesTableProps) {
  const columns = useMemo<LegacyColumnDef<Speciality>[]>(
    () => [
      {
        id: "speciality_name",
        accessorKey: "speciality_name",
        header: "Speciality",
        cell: ({ row }) => (
          <div className="flex max-w-xs flex-col gap-0.5 py-0.5">
            <span className="flex items-center gap-1.5 truncate text-table-body font-semibold text-foreground">
              {row.original.parent && <span className="text-muted-foreground/60">↳</span>}
              {row.original.speciality_name}
            </span>
            <span className="truncate text-caption">
              {row.original.parent ? `Under "${row.original.parent.speciality_name}"` : "Top-level"}
            </span>
          </div>
        ),
      },
      {
        id: "city_hospital",
        header: "City / Hospital",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5 py-0.5 text-body-sm">
            <span className="text-foreground">{row.original.city.city_name}</span>
            <span className="text-caption">{row.original.hospital ? row.original.hospital.hospital_name : "—"}</span>
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
          const speciality = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canView && (
                <TableActionButton
                  icon={HelpCircle}
                  label="FAQs"
                  ariaLabel="Manage speciality FAQs"
                  onClick={() => onManageFaqs(speciality)}
                />
              )}
              {canView && (
                <TableActionButton
                  icon={Activity}
                  label="Symptoms"
                  ariaLabel="Manage speciality symptoms"
                  onClick={() => onManageSymptoms(speciality)}
                />
              )}
              {canView && (
                <TableActionButton
                  icon={Eye}
                  label="View"
                  ariaLabel="View speciality"
                  onClick={() => onView(speciality)}
                />
              )}
              {canUpdate && (
                <TableActionButton
                  icon={Pencil}
                  label="Edit"
                  ariaLabel="Edit speciality"
                  onClick={() => onEdit(speciality)}
                />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete speciality"
                  variant="destructive"
                  onClick={() => onDelete(speciality)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [canView, canUpdate, canDelete, onView, onEdit, onDelete, onManageFaqs, onManageSymptoms]
  );

  const filteredSpecialities = useMemo(() => {
    const q = search.trim().toLowerCase();
    return specialities.filter((speciality) => {
      const matchesSearch =
        !q ||
        speciality.speciality_name.toLowerCase().includes(q) ||
        speciality.seo_url.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || speciality.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [specialities, search, statusFilter]);

  const isFiltering = search.trim() !== "" || statusFilter !== "all";

  return (
    <DataTable
      columns={columns}
      data={filteredSpecialities}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(speciality) => String(speciality.id)}
      emptyIcon={Stethoscope}
      emptyTitle={isFiltering ? "No matching specialities" : "No specialities found"}
      emptyDescription={
        isFiltering
          ? "Try adjusting your search or status filter."
          : "Create your first speciality to get started."
      }
      emptyAction={
        !isFiltering && canCreate ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add Speciality
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
          search={<SearchInput value={search} onChange={onSearchChange} placeholder="Search specialities…" />}
        />
      }
    />
  );
}
