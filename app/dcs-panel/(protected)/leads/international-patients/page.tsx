"use client";

import { useState } from "react";
import { ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { InternationalPatientLeadFormDialog } from "@/components/admin/leads/InternationalPatientLeadFormDialog";
import { InternationalPatientLeadsTable } from "@/components/admin/leads/InternationalPatientLeadsTable";
import { DeleteInternationalPatientLeadDialog } from "@/components/admin/leads/DeleteInternationalPatientLeadDialog";
import { DetailSheet } from "@/components/admin/DetailSheet";
import { leadsKeys } from "@/components/admin/leads/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listInternationalPatientLeads } from "@/lib/api/leads";
import { formatDate } from "@/lib/format-date";
import type { InternationalPatientLead } from "@/types/lead";

const MODULE_SLUG = "international-patients-leads";

export default function InternationalPatientLeadsPage() {
  const { canView, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView(MODULE_SLUG);
  const hasUpdateAccess = canUpdate(MODULE_SLUG);
  const hasDeleteAccess = canDelete(MODULE_SLUG);

  const [countryFilter, setCountryFilter] = useState("");
  const [viewTarget, setViewTarget] = useState<InternationalPatientLead | null>(null);
  const [editTarget, setEditTarget] = useState<InternationalPatientLead | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InternationalPatientLead | null>(null);

  const leadsQuery = useQuery({
    queryKey: [...leadsKeys.internationalPatients, countryFilter],
    queryFn: () => listInternationalPatientLeads(countryFilter ? { country: countryFilter } : undefined),
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
          You don&apos;t have permission to view international patient leads.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="International Patient Leads"
        description="View international patient enquiries submitted through the website."
      />

      <InternationalPatientLeadsTable
        leads={leadsQuery.data?.internationalPatientLeads ?? []}
        loading={leadsQuery.isLoading}
        error={
          leadsQuery.isError
            ? leadsQuery.error instanceof ApiError
              ? leadsQuery.error.message
              : "Unable to load international patient leads. Please try again."
            : null
        }
        onRetry={() => leadsQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={hasUpdateAccess}
        canDelete={hasDeleteAccess}
        countryFilter={countryFilter}
        onCountryFilterChange={setCountryFilter}
        onView={(lead) => setViewTarget(lead)}
        onEdit={(lead) => setEditTarget(lead)}
        onDelete={(lead) => setDeleteTarget(lead)}
      />

      <InternationalPatientLeadFormDialog lead={editTarget} onClose={() => setEditTarget(null)} />

      <DeleteInternationalPatientLeadDialog lead={deleteTarget} onClose={() => setDeleteTarget(null)} />

      <DetailSheet
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="International Patient Lead"
        description={viewTarget?.name}
        sections={
          viewTarget
            ? [
                {
                  heading: "Lead Information",
                  rows: [
                    { label: "Name", value: viewTarget.name },
                    { label: "Age", value: viewTarget.age ?? "—" },
                    { label: "Gender", value: viewTarget.gender || "—" },
                    { label: "Country", value: viewTarget.country || "—" },
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
