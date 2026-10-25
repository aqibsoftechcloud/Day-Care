"use client";

import { DetailSheet } from "@/components/admin/DetailSheet";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format-date";
import { toSafeEditorHtml } from "@/lib/sanitize-html";
import type { Hospital } from "@/types/hospital";

type HospitalViewDialogProps = {
  hospital: Hospital | null;
  onClose: () => void;
};

export function HospitalViewDialog({ hospital, onClose }: HospitalViewDialogProps) {
  if (!hospital) return null;

  return (
    <DetailSheet
      open={!!hospital}
      onClose={onClose}
      title="Hospital Details"
      description={hospital.hospital_name}
      sections={[
        {
          heading: "Hospital Information",
          rows: [
            { label: "Hospital Name", value: hospital.hospital_name },
            { label: "City", value: hospital.cities.city_name },
            { label: "Location", value: hospital.locations ? hospital.locations.area : "—" },
            { label: "Phone Number", value: hospital.phone_number || "—" },
            { label: "Timings", value: hospital.timings || "—" },
            { label: "Google Reviews", value: hospital.google_reviews ?? "—" },
            { label: "Patient Satisfaction Score", value: hospital.patient_satisfaction_score ?? "—" },
            { label: "Status", value: <StatusBadge status={hospital.status} /> },
          ],
        },
        {
          heading: "Content",
          rows: [
            {
              label: "Image",
              value: hospital.hospital_image ? (
                // eslint-disable-next-line @next/next/no-img-element -- small preview of a user-supplied external URL, not an app asset.
                <img src={hospital.hospital_image} alt="" className="max-h-16 rounded-md border border-border object-contain" />
              ) : (
                "—"
              ),
            },
            { label: "Address", value: hospital.address || "—" },
            { label: "360° View URL", value: hospital.location_360_view || "—" },
            { label: "Location Map", value: hospital.location_map || "—" },
            { label: "Short Description", value: hospital.hospital_description || "—" },
            {
              label: "Description",
              value: hospital.long_description ? (
                <div className="rte-content" dangerouslySetInnerHTML={{ __html: toSafeEditorHtml(hospital.long_description) }} />
              ) : (
                "—"
              ),
            },
          ],
        },
        {
          heading: "SEO",
          rows: [
            { label: "SEO URL", value: hospital.seo_url },
            { label: "Meta Title", value: hospital.meta_title || "—" },
            { label: "Meta Description", value: hospital.meta_description || "—" },
            { label: "Meta Keywords", value: hospital.meta_keywords || "—" },
          ],
        },
        {
          heading: "Timestamps",
          rows: [
            { label: "Created", value: formatDate(hospital.created_at) },
            { label: "Updated", value: formatDate(hospital.updated_at) },
          ],
        },
      ]}
    />
  );
}
