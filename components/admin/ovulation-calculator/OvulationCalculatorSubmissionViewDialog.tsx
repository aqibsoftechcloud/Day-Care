"use client";

import { DetailSheet } from "@/components/admin/DetailSheet";
import { formatDate } from "@/lib/format-date";
import type { OvulationCalculatorSubmission } from "@/types/ovulation-calculator";

type OvulationCalculatorSubmissionViewDialogProps = {
  submission: OvulationCalculatorSubmission | null;
  onClose: () => void;
};

export function OvulationCalculatorSubmissionViewDialog({
  submission,
  onClose,
}: OvulationCalculatorSubmissionViewDialogProps) {
  if (!submission) return null;

  return (
    <DetailSheet
      open={!!submission}
      onClose={onClose}
      title="Submission Details"
      description={submission.name}
      sections={[
        {
          heading: "Submission Information",
          rows: [
            { label: "Name", value: submission.name },
            { label: "Email", value: submission.email || "—" },
            { label: "Mobile Number", value: submission.mobile_number || "—" },
          ],
        },
        {
          heading: "Timestamps",
          rows: [{ label: "Submitted", value: formatDate(submission.created_at) }],
        },
      ]}
    />
  );
}
