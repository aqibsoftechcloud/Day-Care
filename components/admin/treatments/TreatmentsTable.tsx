"use client";

import { useMemo } from "react";
import { Activity, Eye, HelpCircle, Pencil, Plus, Stethoscope, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { Treatment } from "@/types/treatment";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { FilterDropdown } from "@/components/admin/data-table/FilterDropdown";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";

type TreatmentsTableProps = {
  treatments: Treatment[];
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
  onView: (treatment: Treatment) => void;
  onEdit: (treatment: Treatment) => void;
  onDelete: (treatment: Treatment) => void;
  onManageFaqs: (treatment: Treatment) => void;
  onManageSymptoms: (treatment: Treatment) => void;
};

export function TreatmentsTable({
  treatments,
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
}: TreatmentsTableProps) {
  const columns = useMemo<LegacyColumnDef<Treatment>[]>(
    () => [
      {
        id: "sub_speciality_name",
        accessorKey: "sub_speciality_name",
        header: "Treatment",
        cell: ({ row }) => (
          <div className="flex max-w-xs flex-col gap-0.5 py-0.5">
            <span className="truncate text-table-body font-semibold text-foreground">
              {row.original.sub_speciality_name}
            </span>
            <span className="truncate text-caption">{row.original.speciality.speciality_name}</span>
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
          const treatment = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canView && (
                <TableActionButton
                  icon={HelpCircle}
                  label="FAQs"
                  ariaLabel="Manage treatment FAQs"
                  onClick={() => onManageFaqs(treatment)}
                />
              )}
              {canView && (
                <TableActionButton
                  icon={Activity}
                  label="Symptoms"
                  ariaLabel="Manage treatment symptoms"
                  onClick={() => onManageSymptoms(treatment)}
                />
              )}
              {canView && (
                <TableActionButton
                  icon={Eye}
                  label="View"
                  ariaLabel="View treatment"
                  onClick={() => onView(treatment)}
                />
              )}
              {canUpdate && (
                <TableActionButton
                  icon={Pencil}
                  label="Edit"
                  ariaLabel="Edit treatment"
                  onClick={() => onEdit(treatment)}
                />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete treatment"
                  variant="destructive"
                  onClick={() => onDelete(treatment)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [canView, canUpdate, canDelete, onView, onEdit, onDelete, onManageFaqs, onManageSymptoms]
  );

  const filteredTreatments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return treatments.filter((treatment) => {
      const matchesSearch =
        !q ||
        treatment.sub_speciality_name.toLowerCase().includes(q) ||
        treatment.seo_url.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || treatment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [treatments, search, statusFilter]);

  const isFiltering = search.trim() !== "" || statusFilter !== "all";

  return (
    <DataTable
      columns={columns}
      data={filteredTreatments}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(treatment) => String(treatment.id)}
      emptyIcon={Stethoscope}
      emptyTitle={isFiltering ? "No matching treatments" : "No treatments found"}
      emptyDescription={
        isFiltering
          ? "Try adjusting your search or status filter."
          : "Create your first treatment to get started."
      }
      emptyAction={
        !isFiltering && canCreate ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add Treatment
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
          search={<SearchInput value={search} onChange={onSearchChange} placeholder="Search treatments…" />}
        />
      }
    />
  );
}
