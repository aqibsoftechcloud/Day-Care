"use client";

import { useMemo } from "react";
import { Eye, Stethoscope, Pencil, Plus, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { DoctorPage } from "@/types/doctor-page";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { FilterDropdown } from "@/components/admin/data-table/FilterDropdown";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";

type DoctorPagesTableProps = {
  doctorPages: DoctorPage[];
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
  onView: (doctorPage: DoctorPage) => void;
  onEdit: (doctorPage: DoctorPage) => void;
  onDelete: (doctorPage: DoctorPage) => void;
};

export function DoctorPagesTable({
  doctorPages,
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
}: DoctorPagesTableProps) {
  const columns = useMemo<LegacyColumnDef<DoctorPage>[]>(
    () => [
      {
        id: "pagename",
        accessorKey: "pagename",
        header: "Page Name",
        cell: ({ row }) => (
          <div className="flex max-w-xs flex-col gap-0.5 py-0.5">
            <span className="truncate text-table-body font-semibold text-foreground">{row.original.pagename}</span>
            <span className="truncate text-caption">/{row.original.seo_url}</span>
          </div>
        ),
      },
      {
        id: "speciality",
        header: "Speciality",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-body-sm text-foreground">{row.original.speciality.speciality_name}</span>
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
          const doctorPage = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canView && (
                <TableActionButton
                  icon={Eye}
                  label="View"
                  ariaLabel="View doctor page"
                  onClick={() => onView(doctorPage)}
                />
              )}
              {canUpdate && (
                <TableActionButton
                  icon={Pencil}
                  label="Edit"
                  ariaLabel="Edit doctor page"
                  onClick={() => onEdit(doctorPage)}
                />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete doctor page"
                  variant="destructive"
                  onClick={() => onDelete(doctorPage)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [canView, canUpdate, canDelete, onView, onEdit, onDelete]
  );

  const filteredDoctorPages = useMemo(() => {
    const q = search.trim().toLowerCase();
    return doctorPages.filter((doctorPage) => {
      const matchesSearch =
        !q ||
        doctorPage.pagename.toLowerCase().includes(q) ||
        doctorPage.seo_url.toLowerCase().includes(q) ||
        doctorPage.speciality.speciality_name.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || doctorPage.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [doctorPages, search, statusFilter]);

  const isFiltering = search.trim() !== "" || statusFilter !== "all";

  return (
    <DataTable
      columns={columns}
      data={filteredDoctorPages}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(doctorPage) => String(doctorPage.id)}
      emptyIcon={Stethoscope}
      emptyTitle={isFiltering ? "No matching doctor pages" : "No doctor pages found"}
      emptyDescription={
        isFiltering ? "Try adjusting your search or status filter." : "Create your first doctor page to get started."
      }
      emptyAction={
        !isFiltering && canCreate ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add Doctor Page
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
          search={<SearchInput value={search} onChange={onSearchChange} placeholder="Search doctor pages…" />}
        />
      }
    />
  );
}
