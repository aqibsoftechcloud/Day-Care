"use client";

import { DetailSheet } from "@/components/admin/DetailSheet";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format-date";
import { toSafeEditorHtml } from "@/lib/sanitize-html";
import type { Testimonial } from "@/types/testimonial";

type TestimonialViewDialogProps = {
  testimonial: Testimonial | null;
  onClose: () => void;
};

export function TestimonialViewDialog({ testimonial, onClose }: TestimonialViewDialogProps) {
  if (!testimonial) return null;

  return (
    <DetailSheet
      open={!!testimonial}
      onClose={onClose}
      title="Testimonial Details"
      description={testimonial.testimonial_name}
      sections={[
        {
          heading: "Testimonial Information",
          rows: [
            { label: "Testimonial Name", value: testimonial.testimonial_name },
            { label: "Language", value: testimonial.language.name },
            { label: "City", value: testimonial.city.city_name },
            { label: "Location", value: testimonial.location ? testimonial.location.area : "—" },
            { label: "Hospital", value: testimonial.hospital ? testimonial.hospital.hospital_name : "—" },
            { label: "Doctor", value: testimonial.doctor ? testimonial.doctor.doctor_name : "—" },
            { label: "Speciality", value: testimonial.speciality ? testimonial.speciality.speciality_name : "—" },
            { label: "Publish Date", value: testimonial.publish_date ? formatDate(testimonial.publish_date) : "—" },
            { label: "Status", value: <StatusBadge status={testimonial.status} /> },
          ],
        },
        {
          heading: "Content",
          rows: [
            {
              label: "Image",
              value: testimonial.testimonial_image ? (
                // eslint-disable-next-line @next/next/no-img-element -- small preview of the stored uploaded image.
                <img src={testimonial.testimonial_image} alt="" className="max-h-16 rounded-md border border-border object-contain" />
              ) : (
                "—"
              ),
            },
            { label: "YouTube URL", value: testimonial.youtube_url || "—" },
            {
              label: "Description",
              value: testimonial.description ? (
                <div className="rte-content" dangerouslySetInnerHTML={{ __html: toSafeEditorHtml(testimonial.description) }} />
              ) : (
                "—"
              ),
            },
          ],
        },
        {
          heading: "SEO",
          rows: [
            { label: "SEO URL", value: testimonial.seo_url },
            { label: "Meta Title", value: testimonial.meta_title || "—" },
            { label: "Meta Description", value: testimonial.meta_description || "—" },
            { label: "Meta Keywords", value: testimonial.meta_keywords || "—" },
          ],
        },
        {
          heading: "Timestamps",
          rows: [
            { label: "Created", value: formatDate(testimonial.created_at) },
            { label: "Updated", value: formatDate(testimonial.updated_at) },
          ],
        },
      ]}
    />
  );
}
