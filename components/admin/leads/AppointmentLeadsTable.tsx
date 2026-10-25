"use client";

import { useMemo } from "react";
import { CalendarClock, Eye, Pencil, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { AppointmentLead } from "@/types/lead";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";

type AppointmentLeadsTableProps = {
  leads: AppointmentLead[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  canView: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  emailFilter: string;
  onEmailFilterChange: (value: string) => void;
  onView: (lead: AppointmentLead) => void;
  onEdit: (lead: AppointmentLead) => void;
  onDelete: (lead: AppointmentLead) => void;
};

/** City / treatment names as the visitor saw them when they submitted — read from the lead's own snapshot, so later renames or deletions never change history. */
function snapshotValue(lead: AppointmentLead, key: string): string | null {
  return lead.extra_data?.find((entry) => entry.key === key)?.value ?? null;
}

export function AppointmentLeadsTable({
  leads,
  loading,
  error,
  onRetry,
  canView,
  canUpdate,
  canDelete,
  emailFilter,
  onEmailFilterChange,
  onView,
  onEdit,
  onDelete,
}: AppointmentLeadsTableProps) {
  // Only "email" is filterable per validators/appointment-lead.validator.ts's
  // listAppointmentLeadsQuerySchema (exact match) — first/last name and
  // phone number have no backend filter support, so they get no filter row.
  const columns = useMemo<LegacyColumnDef<AppointmentLead>[]>(
    () => [
      {
        id: "first_name",
        accessorKey: "first_name",
        header: "First Name",
        cell: ({ row }) => (
          <span className="truncate text-table-body font-medium text-foreground">
            {row.original.first_name}
          </span>
        ),
      },
      {
        id: "last_name",
        accessorKey: "last_name",
        header: "Last Name",
        cell: ({ row }) => (
          <span className="truncate text-table-body text-foreground">{row.original.last_name}</span>
        ),
      },
      {
        id: "email",
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="truncate text-body-sm text-foreground">{row.original.email}</span>
        ),
      },
      {
        id: "phone_number",
        accessorKey: "phone_number",
        header: "Phone Number",
        cell: ({ row }) => (
          <span className="text-body-sm text-muted-foreground">{row.original.phone_number}</span>
        ),
      },
      {
        id: "treatment",
        header: "Treatment",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="truncate text-body-sm text-foreground">{snapshotValue(row.original, "treatment") ?? "—"}</span>
        ),
      },
      {
        id: "city",
        header: "City",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-body-sm text-foreground">{snapshotValue(row.original, "city") ?? "—"}</span>
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

  const isFiltering = emailFilter.trim() !== "";

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
      emptyIcon={CalendarClock}
      emptyTitle={isFiltering ? "No matching leads" : "No appointment leads found"}
      emptyDescription={
        isFiltering
          ? "No lead matches that email."
          : "Appointment enquiries submitted through the website will appear here."
      }
      toolbar={
        <FilterBar
          search={
            <SearchInput value={emailFilter} onChange={onEmailFilterChange} placeholder="Search by email…" />
          }
        />
      }
    />
  );
}
