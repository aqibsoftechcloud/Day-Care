"use client";

import { useMemo } from "react";
import { CalendarHeart, Eye } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { OvulationCalculatorSubmission } from "@/types/ovulation-calculator";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";

type OvulationCalculatorSubmissionsTableProps = {
  submissions: OvulationCalculatorSubmission[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  canView: boolean;
  onView: (submission: OvulationCalculatorSubmission) => void;
};

/**
 * No search/filter toolbar: validators/ovulation-calculator.validator.ts's
 * own comment confirms the backend exposes no query parameters at all
 * (not even a single filterable field), so none is invented here — same
 * precedent as AIConfigurationsTable dropping its `toolbar` prop entirely
 * when there's nothing to put in it. `density`/`showRowNumbers` mirror the
 * closest architectural sibling in this codebase, the read-heavy lead
 * tables (e.g. FeedbackLeadsTable).
 */
export function OvulationCalculatorSubmissionsTable({
  submissions,
  loading,
  error,
  onRetry,
  canView,
  onView,
}: OvulationCalculatorSubmissionsTableProps) {
  const columns = useMemo<LegacyColumnDef<OvulationCalculatorSubmission>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="truncate text-table-body font-medium text-foreground">{row.original.name}</span>
        ),
      },
      {
        id: "email",
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="truncate text-body-sm text-foreground">{row.original.email || "—"}</span>
        ),
      },
      {
        id: "mobile_number",
        accessorKey: "mobile_number",
        header: "Mobile Number",
        cell: ({ row }) => (
          <span className="text-body-sm text-muted-foreground">{row.original.mobile_number || "—"}</span>
        ),
      },
      {
        id: "created_at",
        accessorKey: "created_at",
        header: "Submitted",
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
                ariaLabel="View submission"
                onClick={() => onView(row.original)}
              />
            )}
          </div>
        ),
      },
    ],
    [canView, onView]
  );

  return (
    <DataTable
      columns={columns}
      data={submissions}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(submission) => String(submission.id)}
      density="compact"
      showRowNumbers
      emptyIcon={CalendarHeart}
      emptyTitle="No submissions found"
      emptyDescription="Submissions from the ovulation calculator will appear here."
    />
  );
}
