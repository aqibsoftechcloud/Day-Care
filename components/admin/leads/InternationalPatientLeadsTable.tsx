"use client";

import { useMemo } from "react";
import { Eye, Globe2, Pencil, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { InternationalPatientLead } from "@/types/lead";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";

type InternationalPatientLeadsTableProps = {
  leads: InternationalPatientLead[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  canView: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  countryFilter: string;
  onCountryFilterChange: (value: string) => void;
  onView: (lead: InternationalPatientLead) => void;
  onEdit: (lead: InternationalPatientLead) => void;
  onDelete: (lead: InternationalPatientLead) => void;
};

export function InternationalPatientLeadsTable({
  leads,
  loading,
  error,
  onRetry,
  canView,
  canUpdate,
  canDelete,
  countryFilter,
  onCountryFilterChange,
  onView,
  onEdit,
  onDelete,
}: InternationalPatientLeadsTableProps) {
  // Only "country" is filterable per
  // validators/international-patient-lead.validator.ts's
  // listInternationalPatientLeadsQuerySchema (exact match) — name, age,
  // and gender have no backend filter support.
  const columns = useMemo<LegacyColumnDef<InternationalPatientLead>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="truncate text-table-body font-medium text-foreground">
            {row.original.name}
          </span>
        ),
      },
      {
        id: "country",
        accessorKey: "country",
        header: "Country",
        cell: ({ row }) => (
          <span className="text-body-sm text-foreground">{row.original.country || "—"}</span>
        ),
      },
      {
        id: "age",
        accessorKey: "age",
        header: "Age",
        cell: ({ row }) => (
          <span className="text-body-sm text-muted-foreground">{row.original.age ?? "—"}</span>
        ),
      },
      {
        id: "gender",
        accessorKey: "gender",
        header: "Gender",
        cell: ({ row }) => (
          <span className="text-body-sm text-muted-foreground">{row.original.gender || "—"}</span>
        ),
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
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            {canView && (
              <TableActionButton
                icon={Eye}
                label="View"
                ariaLabel="View lead"
                onClick={() => onView(row.original)}
              />
            )}
            {canUpdate && (
              <TableActionButton
                icon={Pencil}
                label="Edit"
                ariaLabel="Edit lead"
                onClick={() => onEdit(row.original)}
              />
            )}
            {canDelete && (
              <TableActionButton
                icon={Trash2}
                label="Delete"
                ariaLabel="Delete lead"
                variant="destructive"
                onClick={() => onDelete(row.original)}
              />
            )}
          </div>
        ),
      },
    ],
    [canView, canUpdate, canDelete, onView, onEdit, onDelete]
  );

  const isFiltering = countryFilter.trim() !== "";

  return (
    <DataTable
      columns={columns}
      data={leads}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(lead) => String(lead.id)}
      density="compact"
      showRowNumbers
      emptyIcon={Globe2}
      emptyTitle={isFiltering ? "No matching leads" : "No international patient leads found"}
      emptyDescription={
        isFiltering
          ? "No lead matches that country."
          : "International patient enquiries submitted through the website will appear here."
      }
      toolbar={
        <FilterBar
          search={
            <SearchInput
              value={countryFilter}
              onChange={onCountryFilterChange}
              placeholder="Search by country…"
            />
          }
        />
      }
    />
  );
}
