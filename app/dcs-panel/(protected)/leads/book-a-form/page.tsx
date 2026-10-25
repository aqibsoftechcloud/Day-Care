"use client";

import { useMemo, useState } from "react";
import { ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BookaformDataFormDialog } from "@/components/admin/leads/BookaformDataFormDialog";
import { BookaformDataTable } from "@/components/admin/leads/BookaformDataTable";
import { DeleteBookaformDataDialog } from "@/components/admin/leads/DeleteBookaformDataDialog";
import { DetailSheet } from "@/components/admin/DetailSheet";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { leadsKeys } from "@/components/admin/leads/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listBookaformData } from "@/lib/api/leads";
import { formatDate } from "@/lib/format-date";
import type { BookaformData, BookaformDataStatus } from "@/types/lead";

const MODULE_SLUG = "book-a-form-data";

export default function BookaformDataPage() {
  const { canView, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView(MODULE_SLUG);
  const hasUpdateAccess = canUpdate(MODULE_SLUG);
  const hasDeleteAccess = canDelete(MODULE_SLUG);

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [viewTarget, setViewTarget] = useState<BookaformData | null>(null);
  const [editTarget, setEditTarget] = useState<BookaformData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BookaformData | null>(null);

  const recordsQuery = useQuery({
    queryKey: [...leadsKeys.bookaform, statusFilter],
    queryFn: () =>
      listBookaformData(
        statusFilter !== "all" ? { status: statusFilter as BookaformDataStatus } : undefined
      ),
    enabled: hasViewAccess,
  });

  // "data_from" has no backend filter support (confirmed in
  // validators/bookaform.validator.ts) — filtered client-side over the
  // already status-filtered list, same pattern used by the standard CMS
  // CRUD tables.
  const filteredRecords = useMemo(() => {
    const all = recordsQuery.data?.bookaformDataList ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter((record) => record.data_from.toLowerCase().includes(q));
  }, [recordsQuery.data, search]);

  if (!hasViewAccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card px-6 py-20 text-center shadow-xs">
        <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShieldOff className="size-5" aria-hidden="true" />
        </span>
        <p className="text-subtitle text-foreground">Access restricted</p>
        <p className="mt-1 max-w-sm text-body-sm text-muted-foreground">
          You don&apos;t have permission to view Book-a-Form data.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Book-a-Form Data"
        description="View Book-a-Form submissions collected through the website."
      />

      <BookaformDataTable
        records={filteredRecords}
        loading={recordsQuery.isLoading}
        error={
          recordsQuery.isError
            ? recordsQuery.error instanceof ApiError
              ? recordsQuery.error.message
              : "Unable to load Book-a-Form data. Please try again."
            : null
        }
        onRetry={() => recordsQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={hasUpdateAccess}
        canDelete={hasDeleteAccess}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        search={search}
        onSearchChange={setSearch}
        onView={(record) => setViewTarget(record)}
        onEdit={(record) => setEditTarget(record)}
        onDelete={(record) => setDeleteTarget(record)}
      />

      <BookaformDataFormDialog record={editTarget} onClose={() => setEditTarget(null)} />

      <DeleteBookaformDataDialog record={deleteTarget} onClose={() => setDeleteTarget(null)} />

      <DetailSheet
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="Book-a-Form Submission"
        description={viewTarget?.data_from}
        sections={
          viewTarget
            ? [
                {
                  heading: "Submission Details",
                  rows: [
                    { label: "Submitted From", value: viewTarget.data_from },
                    { label: "Status", value: <StatusBadge status={viewTarget.status} /> },
                  ],
                },
                {
                  heading: "Timestamps",
                  rows: [
                    { label: "Created", value: formatDate(viewTarget.created_at) },
                    { label: "Updated", value: formatDate(viewTarget.updated_at) },
                  ],
                },
              ]
            : []
        }
      />
    </div>
  );
}
