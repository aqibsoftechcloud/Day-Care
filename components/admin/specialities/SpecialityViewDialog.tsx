"use client";

import { DetailSheet } from "@/components/admin/DetailSheet";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format-date";
import { toSafeEditorHtml } from "@/lib/sanitize-html";
import type { Speciality } from "@/types/speciality";

type SpecialityViewDialogProps = {
  speciality: Speciality | null;
  onClose: () => void;
};

export function SpecialityViewDialog({ speciality, onClose }: SpecialityViewDialogProps) {
  if (!speciality) return null;

  return (
    <DetailSheet
      open={!!speciality}
      onClose={onClose}
      title="Speciality Details"
      description={speciality.speciality_name}
      sections={[
        {
          heading: "Speciality Information",
          rows: [
            { label: "Speciality Name", value: speciality.speciality_name },
            { label: "Speciality Title", value: speciality.speciality_title || "—" },
            { label: "City", value: speciality.city.city_name },
            { label: "Location", value: speciality.location ? speciality.location.area : "—" },
            { label: "Hospital", value: speciality.hospital ? speciality.hospital.hospital_name : "—" },
            { label: "Parent Speciality", value: speciality.parent ? speciality.parent.speciality_name : "None (top-level)" },
            { label: "Keywords for Doctors", value: speciality.keywords_for_doctors || "—" },
            { label: "AI Content Generator", value: speciality.ai_content_generator ? "Enabled" : "Disabled" },
            { label: "Status", value: <StatusBadge status={speciality.status} /> },
          ],
        },
        {
          heading: "Content",
          rows: [
            {
              label: "Logo",
              value: speciality.speciality_logo ? (
                // eslint-disable-next-line @next/next/no-img-element -- small preview of a user-supplied external URL, not an app asset.
                <img src={speciality.speciality_logo} alt="" className="max-h-16 rounded-md border border-border object-contain" />
              ) : (
                "—"
              ),
            },
            { label: "Short Description", value: speciality.short_description || "—" },
            {
              label: "Description",
              value: speciality.description ? (
                <div className="rte-content" dangerouslySetInnerHTML={{ __html: toSafeEditorHtml(speciality.description) }} />
              ) : (
                "—"
              ),
            },
          ],
        },
        {
          heading: "SEO",
          rows: [
            { label: "SEO URL", value: speciality.seo_url },
            { label: "Meta Title", value: speciality.meta_title || "—" },
            { label: "Meta Description", value: speciality.meta_description || "—" },
            { label: "Meta Keyword", value: speciality.meta_keyword || "—" },
          ],
        },
        {
          heading: "Timestamps",
          rows: [
            { label: "Created", value: formatDate(speciality.created_at) },
            { label: "Updated", value: formatDate(speciality.updated_at) },
          ],
        },
      ]}
    />
  );
}
