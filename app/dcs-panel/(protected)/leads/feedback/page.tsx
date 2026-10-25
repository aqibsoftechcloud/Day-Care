"use client";

import { useState } from "react";
import { ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FeedbackLeadFormDialog } from "@/components/admin/leads/FeedbackLeadFormDialog";
import { FeedbackLeadsTable } from "@/components/admin/leads/FeedbackLeadsTable";
import { DeleteFeedbackLeadDialog } from "@/components/admin/leads/DeleteFeedbackLeadDialog";
import { DetailSheet } from "@/components/admin/DetailSheet";
import { leadsKeys } from "@/components/admin/leads/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listFeedbackLeads } from "@/lib/api/leads";
import { formatDate } from "@/lib/format-date";
import type { FeedbackLead } from "@/types/lead";

const MODULE_SLUG = "feedback-leads";

export default function FeedbackLeadsPage() {
  const { canView, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView(MODULE_SLUG);
  const hasUpdateAccess = canUpdate(MODULE_SLUG);
  const hasDeleteAccess = canDelete(MODULE_SLUG);

  const [emailFilter, setEmailFilter] = useState("");
  const [viewTarget, setViewTarget] = useState<FeedbackLead | null>(null);
  const [editTarget, setEditTarget] = useState<FeedbackLead | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FeedbackLead | null>(null);

  const leadsQuery = useQuery({
    queryKey: [...leadsKeys.feedback, emailFilter],
    queryFn: () => listFeedbackLeads(emailFilter ? { email: emailFilter } : undefined),
    enabled: hasViewAccess,
  });

  if (!hasViewAccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card px-6 py-20 text-center shadow-xs">
        <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShieldOff className="size-5" aria-hidden="true" />
        </span>
        <p className="text-subtitle text-foreground">Access restricted</p>
        <p className="mt-1 max-w-sm text-body-sm text-muted-foreground">
          You don&apos;t have permission to view feedback leads.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Feedback Leads"
        description="View feedback submitted through the website."
      />

      <FeedbackLeadsTable
        leads={leadsQuery.data?.feedbackLeads ?? []}
        loading={leadsQuery.isLoading}
        error={
          leadsQuery.isError
            ? leadsQuery.error instanceof ApiError
              ? leadsQuery.error.message
              : "Unable to load feedback leads. Please try again."
            : null
        }
        onRetry={() => leadsQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={hasUpdateAccess}
        canDelete={hasDeleteAccess}
        emailFilter={emailFilter}
        onEmailFilterChange={setEmailFilter}
        onView={(lead) => setViewTarget(lead)}
        onEdit={(lead) => setEditTarget(lead)}
        onDelete={(lead) => setDeleteTarget(lead)}
      />

      <FeedbackLeadFormDialog lead={editTarget} onClose={() => setEditTarget(null)} />

      <DeleteFeedbackLeadDialog lead={deleteTarget} onClose={() => setDeleteTarget(null)} />

      <DetailSheet
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="Feedback Lead"
        description={viewTarget?.name}
        sections={
          viewTarget
            ? [
                {
                  heading: "Lead Information",
                  rows: [
                    { label: "Name", value: viewTarget.name },
                    { label: "Email", value: viewTarget.email },
                    { label: "Phone", value: viewTarget.phone_number },
                    { label: "Hospital / Location", value: viewTarget.hospital_location || "—" },
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
