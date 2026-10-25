"use client";

import { DetailSheet } from "@/components/admin/DetailSheet";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format-date";
import { toSafeEditorHtml } from "@/lib/sanitize-html";
import type { GlobalSpeciality } from "@/types/global-speciality";

type GlobalSpecialityViewDialogProps = {
  globalSpeciality: GlobalSpeciality | null;
  onClose: () => void;
};

export function GlobalSpecialityViewDialog({ globalSpeciality, onClose }: GlobalSpecialityViewDialogProps) {
  if (!globalSpeciality) return null;

  return (
    <DetailSheet
      open={!!globalSpeciality}
      onClose={onClose}
      title="Global Speciality Details"
      description={globalSpeciality.speciality_name}
      sections={[
        {
          heading: "Global Speciality Information",
          rows: [
            { label: "Speciality Name", value: globalSpeciality.speciality_name },
            { label: "Speciality Title", value: globalSpeciality.speciality_title || "—" },
            { label: "Linked Cities", value: String(globalSpeciality.linkedCityCount) },
            { label: "Status", value: <StatusBadge status={globalSpeciality.status} /> },
          ],
        },
        {
          heading: "Content",
          rows: [
            {
              label: "Image",
              value: globalSpeciality.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- small preview of the stored uploaded image.
                <img src={globalSpeciality.image} alt="" className="max-h-16 rounded-md border border-border object-contain" />
              ) : (
                "—"
              ),
            },
            { label: "Short Description", value: globalSpeciality.short_description || "—" },
            {
              label: "Description",
              value: globalSpeciality.description ? (
                <div className="rte-content" dangerouslySetInnerHTML={{ __html: toSafeEditorHtml(globalSpeciality.description) }} />
              ) : (
                "—"
              ),
            },
          ],
        },
        {
          heading: "SEO",
          rows: [
            { label: "SEO URL", value: `/dcg/speciality/${globalSpeciality.seo_url}` },
            { label: "Meta Title", value: globalSpeciality.meta_title || "—" },
            { label: "Meta Description", value: globalSpeciality.meta_description || "—" },
            { label: "Meta Keyword", value: globalSpeciality.meta_keyword || "—" },
          ],
        },
        {
          heading: "Timestamps",
          rows: [
            { label: "Created", value: formatDate(globalSpeciality.created_at) },
            { label: "Updated", value: formatDate(globalSpeciality.updated_at) },
          ],
        },
      ]}
    />
  );
}
