"use client";

import { DetailSheet } from "@/components/admin/DetailSheet";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format-date";
import type { Symptom } from "@/types/symptom";

type SymptomViewDialogProps = {
  symptom: Symptom | null;
  onClose: () => void;
};

export function SymptomViewDialog({ symptom, onClose }: SymptomViewDialogProps) {
  if (!symptom) return null;

  return (
    <DetailSheet
      open={!!symptom}
      onClose={onClose}
      title="Symptom Details"
      description={symptom.symptom_name}
      sections={[
        {
          heading: "Symptom Information",
          rows: [
            { label: "Symptom Name", value: symptom.symptom_name },
            { label: "Part", value: symptom.part.part_name },
            { label: "Status", value: <StatusBadge status={symptom.status} /> },
          ],
        },
        {
          heading: "Timestamps",
          rows: [
            { label: "Created", value: formatDate(symptom.created_at) },
            { label: "Updated", value: formatDate(symptom.updated_at) },
          ],
        },
      ]}
    />
  );
}
