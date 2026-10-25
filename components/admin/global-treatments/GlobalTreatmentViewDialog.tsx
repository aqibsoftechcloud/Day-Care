"use client";

import { DetailSheet } from "@/components/admin/DetailSheet";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format-date";
import { toSafeEditorHtml } from "@/lib/sanitize-html";
import type { GlobalTreatment } from "@/types/global-treatment";

type GlobalTreatmentViewDialogProps = {
  globalTreatment: GlobalTreatment | null;
  onClose: () => void;
};

export function GlobalTreatmentViewDialog({ globalTreatment, onClose }: GlobalTreatmentViewDialogProps) {
  if (!globalTreatment) return null;

  return (
    <DetailSheet
      open={!!globalTreatment}
      onClose={onClose}
      title="Global Treatment Details"
      description={globalTreatment.treatment_name}
      sections={[
        {
          heading: "Global Treatment Information",
          rows: [
            { label: "Treatment Name", value: globalTreatment.treatment_name },
            { label: "Treatment Title", value: globalTreatment.treatment_title || "—" },
            { label: "Linked Cities", value: String(globalTreatment.linkedCityCount) },
            { label: "Status", value: <StatusBadge status={globalTreatment.status} /> },
          ],
        },
        {
          heading: "Content",
          rows: [
            {
              label: "Image",
              value: globalTreatment.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- small preview of the stored uploaded image.
                <img src={globalTreatment.image} alt="" className="max-h-16 rounded-md border border-border object-contain" />
              ) : (
                "—"
              ),
            },
            { label: "Short Description", value: globalTreatment.short_description || "—" },
            {
              label: "Description",
              value: globalTreatment.description ? (
                <div className="rte-content" dangerouslySetInnerHTML={{ __html: toSafeEditorHtml(globalTreatment.description) }} />
              ) : (
                "—"
              ),
            },
          ],
        },
        {
          heading: "SEO",
          rows: [
            { label: "SEO URL", value: `/dcg/treatment/${globalTreatment.seo_url}` },
            { label: "Meta Title", value: globalTreatment.meta_title || "—" },
            { label: "Meta Description", value: globalTreatment.meta_description || "—" },
            { label: "Meta Keyword", value: globalTreatment.meta_keyword || "—" },
          ],
        },
        {
          heading: "Timestamps",
          rows: [
            { label: "Created", value: formatDate(globalTreatment.created_at) },
            { label: "Updated", value: formatDate(globalTreatment.updated_at) },
          ],
        },
      ]}
    />
  );
}
