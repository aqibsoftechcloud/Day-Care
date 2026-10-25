"use client";

import { DetailSheet } from "@/components/admin/DetailSheet";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format-date";
import { toSafeEditorHtml } from "@/lib/sanitize-html";
import type { Doctor } from "@/types/doctor";

type DoctorViewDialogProps = {
  doctor: Doctor | null;
  onClose: () => void;
};

export function DoctorViewDialog({ doctor, onClose }: DoctorViewDialogProps) {
  if (!doctor) return null;

  return (
    <DetailSheet
      open={!!doctor}
      onClose={onClose}
      title="Doctor Details"
      description={doctor.doctor_name}
      sections={[
        {
          heading: "Doctor Information",
          rows: [
            { label: "Doctor Name", value: doctor.doctor_name },
            { label: "Qualification", value: doctor.qualification || "—" },
            { label: "Experience", value: doctor.experience || "—" },
            { label: "Availability", value: doctor.availability || "—" },
            { label: "Language", value: doctor.language.name },
            { label: "City", value: doctor.city.city_name },
            { label: "Location", value: doctor.location ? doctor.location.area : "—" },
            { label: "Patient Satisfaction Score", value: doctor.patient_satisfaction_score ?? "—" },
            { label: "Sorting Order", value: doctor.sorting_order },
            { label: "Status", value: <StatusBadge status={doctor.status} /> },
          ],
        },
        {
          heading: "Content",
          rows: [
            {
              label: "Image",
              value: doctor.doctor_image ? (
                // eslint-disable-next-line @next/next/no-img-element -- small preview of the stored uploaded image.
                <img src={doctor.doctor_image} alt="" className="max-h-16 rounded-md border border-border object-contain" />
              ) : (
                "—"
              ),
            },
            { label: "Mon–Sat First Timings", value: doctor.mon_sat_first_timings || "—" },
            { label: "Mon–Sat Second Timings", value: doctor.mon_sat_second_timings || "—" },
            { label: "Sunday Timings", value: doctor.sunday_timings || "—" },
            { label: "Time Interval", value: doctor.time_interval || "—" },
            { label: "Location Map", value: doctor.location_map || "—" },
            { label: "Latitude", value: doctor.latitude ?? "—" },
            { label: "Longitude", value: doctor.longitude ?? "—" },
            { label: "Description", value: doctor.doctor_description || "—" },
            { label: "AI Content Generator", value: doctor.ai_content_generator ? "Enabled" : "Disabled" },
            {
              label: "Doctor Info",
              value: doctor.doc_info ? (
                <div className="rte-content" dangerouslySetInnerHTML={{ __html: toSafeEditorHtml(doctor.doc_info) }} />
              ) : (
                "—"
              ),
            },
          ],
        },
        {
          heading: "SEO",
          rows: [
            { label: "SEO URL", value: doctor.seo_url },
            { label: "Meta Title", value: doctor.meta_title || "—" },
            { label: "Meta Description", value: doctor.meta_description || "—" },
            { label: "Meta Keywords", value: doctor.meta_keywords || "—" },
          ],
        },
        {
          heading: "Timestamps",
          rows: [
            { label: "Created", value: formatDate(doctor.created_at) },
            { label: "Updated", value: formatDate(doctor.updated_at) },
          ],
        },
      ]}
    />
  );
}
