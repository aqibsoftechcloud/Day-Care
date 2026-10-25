"use client";

import { DetailSheet } from "@/components/admin/DetailSheet";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format-date";
import { toSafeEditorHtml } from "@/lib/sanitize-html";
import type { SymptomPart } from "@/types/symptom-part";

type SymptomPartViewDialogProps = {
  part: SymptomPart | null;
  onClose: () => void;
};

export function SymptomPartViewDialog({ part, onClose }: SymptomPartViewDialogProps) {
  if (!part) return null;

  return (
    <DetailSheet
      open={!!part}
      onClose={onClose}
      title="Part Details"
      description={part.part_name}
      sections={[
        {
          heading: "Part Information",
          rows: [
            { label: "Part Name", value: part.part_name },
            { label: "Status", value: <StatusBadge status={part.status} /> },
          ],
        },
        {
          heading: "Content",
          rows: [
            {
              label: "Description",
              value: part.part_description ? (
                <div className="rte-content" dangerouslySetInnerHTML={{ __html: toSafeEditorHtml(part.part_description) }} />
              ) : (
                "—"
              ),
            },
          ],
        },
        {
          heading: "SEO",
          rows: [
            { label: "SEO URL", value: part.seo_url },
            { label: "Meta Title", value: part.meta_title || "—" },
            { label: "Meta Description", value: part.meta_description || "—" },
            { label: "Meta Keywords", value: part.meta_keywords || "—" },
          ],
        },
        {
          heading: "Timestamps",
          rows: [
            { label: "Created", value: formatDate(part.created_at) },
            { label: "Updated", value: formatDate(part.updated_at) },
          ],
        },
      ]}
    />
  );
}
