"use client";

import { useMemo } from "react";
import { Eye, MessageSquareText, Pencil, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { FeedbackLead } from "@/types/lead";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";

type FeedbackLeadsTableProps = {
  leads: FeedbackLead[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  canView: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  emailFilter: string;
  onEmailFilterChange: (value: string) => void;
  onView: (lead: FeedbackLead) => void;
  onEdit: (lead: FeedbackLead) => void;
  onDelete: (lead: FeedbackLead) => void;
};

export function FeedbackLeadsTable({
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
}: FeedbackLeadsTableProps) {
  // Only "email" is filterable per validators/feedback-lead.validator.ts's
  // listFeedbackLeadsQuerySchema (exact match) — name, phone, and
  // hospital_location have no backend filter support.
  const columns = useMemo<LegacyColumnDef<FeedbackLead>[]>(
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
        header: "Phone",
        cell: ({ row }) => (
          <span className="text-body-sm text-muted-foreground">{row.original.phone_number}</span>
        ),
      },
      {
        id: "hospital_location",
        accessorKey: "hospital_location",
        header: "Hospital / Location",
        cell: ({ row }) => (
          <span className="truncate text-body-sm text-muted-foreground">
            {row.original.hospital_location || "—"}
          </span>
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
      emptyIcon={MessageSquareText}
      emptyTitle={isFiltering ? "No matching leads" : "No feedback leads found"}
      emptyDescription={
        isFiltering
          ? "No lead matches that email."
          : "Feedback submitted through the website will appear here."
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
