"use client";

import { useState } from "react";
import { ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { OvulationCalculatorSubmissionsTable } from "@/components/admin/ovulation-calculator/OvulationCalculatorSubmissionsTable";
import { OvulationCalculatorSubmissionViewDialog } from "@/components/admin/ovulation-calculator/OvulationCalculatorSubmissionViewDialog";
import { ovulationCalculatorKeys } from "@/components/admin/ovulation-calculator/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listOvulationCalculatorSubmissions } from "@/lib/api/ovulation-calculator";
import type { OvulationCalculatorSubmission } from "@/types/ovulation-calculator";

const MODULE_SLUG = "submissions";

export default function OvulationCalculatorPage() {
  const { canView } = usePermission();
  const hasViewAccess = canView(MODULE_SLUG);

  const [viewTarget, setViewTarget] = useState<OvulationCalculatorSubmission | null>(null);

  const submissionsQuery = useQuery({
    queryKey: ovulationCalculatorKeys.all,
    queryFn: () => listOvulationCalculatorSubmissions(),
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
          You don&apos;t have permission to view Ovulation Calculator submissions.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Ovulation Calculator"
        description="View submissions captured by the website's ovulation calculator."
      />

      <OvulationCalculatorSubmissionsTable
        submissions={submissionsQuery.data?.submissions ?? []}
        loading={submissionsQuery.isLoading}
        error={
          submissionsQuery.isError
            ? submissionsQuery.error instanceof ApiError
              ? submissionsQuery.error.message
              : "Unable to load submissions. Please try again."
            : null
        }
        onRetry={() => submissionsQuery.refetch()}
        canView={hasViewAccess}
        onView={(submission) => setViewTarget(submission)}
      />

      <OvulationCalculatorSubmissionViewDialog submission={viewTarget} onClose={() => setViewTarget(null)} />
    </div>
  );
}
