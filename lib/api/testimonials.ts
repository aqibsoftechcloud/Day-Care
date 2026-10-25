import { apiFetch } from "./client";
import type {
  CreateTestimonialInput,
  ListTestimonialsFilter,
  Testimonial,
  UpdateTestimonialInput,
} from "@/types/testimonial";

type TestimonialsListResponse = { success: true; testimonials: Testimonial[] };
type TestimonialResponse = { success: true; testimonial: Testimonial };
type DeleteTestimonialResponse = { success: true; message: string };

function toQueryString(filter?: ListTestimonialsFilter): string {
  if (!filter) return "";
  const params = new URLSearchParams();
  if (filter.city_id !== undefined) params.set("city_id", String(filter.city_id));
  if (filter.doctor_id !== undefined) params.set("doctor_id", String(filter.doctor_id));
  if (filter.hospital_id !== undefined) params.set("hospital_id", String(filter.hospital_id));
  if (filter.language_id !== undefined) params.set("language_id", String(filter.language_id));
  if (filter.location_id !== undefined) params.set("location_id", String(filter.location_id));
  if (filter.speciality_id !== undefined) params.set("speciality_id", String(filter.speciality_id));
  if (filter.status !== undefined) params.set("status", filter.status);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function listTestimonials(filter?: ListTestimonialsFilter) {
  return apiFetch<TestimonialsListResponse>(`/api/testimonials${toQueryString(filter)}`);
}

export function getTestimonial(id: number) {
  return apiFetch<TestimonialResponse>(`/api/testimonials/${id}`);
}

/** Builds the multipart body the actual controller expects (parseMultipartFields) — testimonial_image is a real file, never JSON. */
function toTestimonialFormData(data: CreateTestimonialInput | UpdateTestimonialInput, image?: File | null): FormData {
  const formData = new FormData();
  if (data.language_id !== undefined) formData.append("language_id", String(data.language_id));
  if (data.testimonial_name !== undefined) formData.append("testimonial_name", data.testimonial_name);
  if (data.meta_title) formData.append("meta_title", data.meta_title);
  if (data.meta_description) formData.append("meta_description", data.meta_description);
  if (data.meta_keywords) formData.append("meta_keywords", data.meta_keywords);
  if (data.seo_url !== undefined) formData.append("seo_url", data.seo_url);
  if (data.youtube_url) formData.append("youtube_url", data.youtube_url);
  if (data.city_id !== undefined) formData.append("city_id", String(data.city_id));
  if (data.location_id !== undefined && data.location_id !== null) {
    formData.append("location_id", String(data.location_id));
  }
  if (data.hospital_id !== undefined && data.hospital_id !== null) {
    formData.append("hospital_id", String(data.hospital_id));
  }
  if (data.doctor_id !== undefined && data.doctor_id !== null) {
    formData.append("doctor_id", String(data.doctor_id));
  }
  if (data.speciality_id !== undefined && data.speciality_id !== null) {
    formData.append("speciality_id", String(data.speciality_id));
  }
  if (data.publish_date) formData.append("publish_date", data.publish_date);
  if (data.description) formData.append("description", data.description);
  if (data.status) formData.append("status", data.status);
  if (image) formData.append("testimonial_image", image);
  return formData;
}

export function createTestimonial(data: CreateTestimonialInput, image?: File | null) {
  return apiFetch<TestimonialResponse>("/api/testimonials", {
    method: "POST",
    body: toTestimonialFormData(data, image),
  });
}

/** Image is optional on update — omit it to keep the existing stored image. */
export function updateTestimonial(id: number, data: UpdateTestimonialInput, image?: File | null) {
  return apiFetch<TestimonialResponse>(`/api/testimonials/${id}`, {
    method: "PUT",
    body: toTestimonialFormData(data, image),
  });
}

/** Soft delete — sets status to "inactive" server-side; the stored image is intentionally preserved. */
export function deleteTestimonial(id: number) {
  return apiFetch<DeleteTestimonialResponse>(`/api/testimonials/${id}`, { method: "DELETE" });
}
