"use client";

import { DetailSheet } from "@/components/admin/DetailSheet";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format-date";
import { toSafeEditorHtml } from "@/lib/sanitize-html";
import type { DoctorPage } from "@/types/doctor-page";

type DoctorPageViewDialogProps = {
  doctorPage: DoctorPage | null;
  onClose: () => void;
};

export function DoctorPageViewDialog({ doctorPage, onClose }: DoctorPageViewDialogProps) {
  if (!doctorPage) return null;

  return (
    <DetailSheet
      open={!!doctorPage}
      onClose={onClose}
      title="Doctor Page Details"
      description={doctorPage.pagename}
      sections={[
        {
          heading: "Doctor Page Information",
          rows: [
            { label: "Page Name", value: doctorPage.pagename },
            { label: "Speciality", value: doctorPage.speciality.speciality_name },
            { label: "City", value: doctorPage.city.city_name },
            { label: "Location", value: doctorPage.location ? doctorPage.location.area : "—" },
            { label: "Keyword", value: doctorPage.keyword || "—" },
            { label: "Status", value: <StatusBadge status={doctorPage.status} /> },
            {
              label: "Description",
              value: doctorPage.description ? (
                <div className="rte-content" dangerouslySetInnerHTML={{ __html: toSafeEditorHtml(doctorPage.description) }} />
              ) : (
                "—"
              ),
            },
          ],
        },
        {
          heading: "SEO",
          rows: [
            { label: "SEO URL", value: doctorPage.seo_url },
            { label: "Meta Title", value: doctorPage.meta_title || "—" },
            { label: "Meta Description", value: doctorPage.meta_description || "—" },
            { label: "Meta Keywords", value: doctorPage.meta_keywords || "—" },
          ],
        },
        {
          heading: "Timestamps",
          rows: [
            { label: "Created", value: formatDate(doctorPage.created_at) },
            { label: "Updated", value: formatDate(doctorPage.updated_at) },
          ],
        },
      ]}
    />
  );
}
