"use client";

import { DetailSheet } from "@/components/admin/DetailSheet";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format-date";
import { toSafeEditorHtml } from "@/lib/sanitize-html";
import type { Treatment } from "@/types/treatment";

type TreatmentViewDialogProps = {
  treatment: Treatment | null;
  onClose: () => void;
};

export function TreatmentViewDialog({ treatment, onClose }: TreatmentViewDialogProps) {
  if (!treatment) return null;

  return (
    <DetailSheet
      open={!!treatment}
      onClose={onClose}
      title="Treatment Details"
      description={treatment.sub_speciality_name}
      sections={[
        {
          heading: "Treatment Information",
          rows: [
            { label: "Sub-Speciality Name", value: treatment.sub_speciality_name },
            { label: "Sub-Speciality Title", value: treatment.sub_speciality_title || "—" },
            { label: "Speciality", value: treatment.speciality.speciality_name },
            { label: "Language", value: treatment.language.name },
            { label: "City", value: treatment.city.city_name },
            { label: "Location", value: treatment.location ? treatment.location.area : "—" },
            { label: "Hospital", value: treatment.hospital ? treatment.hospital.hospital_name : "—" },
            { label: "Keywords for Doctors", value: treatment.keywords_for_doctors || "—" },
            { label: "AI Content Generator", value: treatment.ai_content_generator ? "Enabled" : "Disabled" },
            { label: "Status", value: <StatusBadge status={treatment.status} /> },
          ],
        },
        {
          heading: "Content",
          rows: [
            {
              label: "Logo",
              value: treatment.speciality_logo ? (
                // eslint-disable-next-line @next/next/no-img-element -- small preview of the currently stored image.
                <img src={treatment.speciality_logo} alt="" className="max-h-16 rounded-md border border-border object-contain" />
              ) : (
                "—"
              ),
            },
            { label: "Short Description", value: treatment.short_description || "—" },
            {
              label: "Description",
              value: treatment.description ? (
                <div className="rte-content" dangerouslySetInnerHTML={{ __html: toSafeEditorHtml(treatment.description) }} />
              ) : (
                "—"
              ),
            },
          ],
        },
        {
          heading: "SEO",
          rows: [
            { label: "SEO URL", value: treatment.seo_url },
            { label: "Meta Title", value: treatment.meta_title || "—" },
            { label: "Meta Description", value: treatment.meta_description || "—" },
            { label: "Meta Keyword", value: treatment.meta_keyword || "—" },
          ],
        },
        {
          heading: "Timestamps",
          rows: [
            { label: "Created", value: formatDate(treatment.created_at) },
            { label: "Updated", value: formatDate(treatment.updated_at) },
          ],
        },
      ]}
    />
  );
}
