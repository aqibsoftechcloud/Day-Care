"use client";

import { useState } from "react";
import { ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AppointmentLeadFormDialog } from "@/components/admin/leads/AppointmentLeadFormDialog";
import { AppointmentLeadsTable } from "@/components/admin/leads/AppointmentLeadsTable";
import { DeleteAppointmentLeadDialog } from "@/components/admin/leads/DeleteAppointmentLeadDialog";
import { DetailSheet } from "@/components/admin/DetailSheet";
import { leadsKeys } from "@/components/admin/leads/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listAppointmentLeads } from "@/lib/api/leads";
import { formatDate } from "@/lib/format-date";
import type { AppointmentLead } from "@/types/lead";

const MODULE_SLUG = "book-an-appointment";

export default function AppointmentLeadsPage() {
  const { canView, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView(MODULE_SLUG);
  const hasUpdateAccess = canUpdate(MODULE_SLUG);
  const hasDeleteAccess = canDelete(MODULE_SLUG);

  const [emailFilter, setEmailFilter] = useState("");
  const [viewTarget, setViewTarget] = useState<AppointmentLead | null>(null);
  const [editTarget, setEditTarget] = useState<AppointmentLead | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppointmentLead | null>(null);

  const leadsQuery = useQuery({
    queryKey: [...leadsKeys.appointments, emailFilter],
    queryFn: () => listAppointmentLeads(emailFilter ? { email: emailFilter } : undefined),
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
          You don&apos;t have permission to view appointment leads.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Appointment Leads"
        description="View appointment enquiries submitted through the website."
      />

      <AppointmentLeadsTable
        leads={leadsQuery.data?.appointmentLeads ?? []}
        loading={leadsQuery.isLoading}
        error={
          leadsQuery.isError
            ? leadsQuery.error instanceof ApiError
              ? leadsQuery.error.message
              : "Unable to load appointment leads. Please try again."
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

      <AppointmentLeadFormDialog lead={editTarget} onClose={() => setEditTarget(null)} />

      <DeleteAppointmentLeadDialog lead={deleteTarget} onClose={() => setDeleteTarget(null)} />

      <DetailSheet
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="Appointment Lead"
        description={viewTarget ? `${viewTarget.first_name} ${viewTarget.last_name}` : undefined}
        sections={
          viewTarget
            ? [
                {
                  heading: "Lead Information",
                  rows: [
                    { label: "Name", value: `${viewTarget.first_name} ${viewTarget.last_name}` },
                    { label: "Email", value: viewTarget.email },
                    { label: "Phone", value: viewTarget.phone_number },
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
