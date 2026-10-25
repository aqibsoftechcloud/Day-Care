export type TestimonialStatus = "active" | "inactive";

/**
 * Mirrors services/testimonial.service.ts's toSafeTestimonial() output —
 * embeds `city`/`language`/`location`/`hospital`/`doctor`/`speciality`
 * (renamed from the raw plural Prisma relations). Confirmed by reading
 * the service directly.
 */
export type Testimonial = {
  id: number;
  language_id: number;
  testimonial_name: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  seo_url: string;
  youtube_url: string | null;
  city_id: number;
  location_id: number | null;
  hospital_id: number | null;
  doctor_id: number | null;
  speciality_id: number | null;
  publish_date: string | null;
  testimonial_image: string | null;
  description: string | null;
  status: TestimonialStatus;
  created_at: string;
  updated_at: string;
  city: { id: number; city_name: string; seo_url: string };
  language: { id: number; name: string; seo_url: string };
  location: { id: number; area: string; zipcode: string; seo_url: string } | null;
  hospital: { id: number; hospital_name: string; seo_url: string } | null;
  doctor: { id: number; doctor_name: string; seo_url: string } | null;
  /** The real clinical speciality (`specialities` table) — never `doctor_specialities`. */
  speciality: { id: number; speciality_name: string; seo_url: string } | null;
};

/** Mirrors validators/testimonial.validator.ts's listTestimonialsQuerySchema — all real, server-supported filters. */
export type ListTestimonialsFilter = {
  city_id?: number;
  doctor_id?: number;
  hospital_id?: number;
  language_id?: number;
  location_id?: number;
  speciality_id?: number;
  status?: TestimonialStatus;
};

/** Mirrors validators/testimonial.validator.ts's createTestimonialSchema — `testimonial_image` is handled separately as a File (multipart upload). */
export type CreateTestimonialInput = {
  language_id: number;
  testimonial_name: string;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  seo_url: string;
  youtube_url?: string | null;
  city_id: number;
  location_id?: number | null;
  hospital_id?: number | null;
  doctor_id?: number | null;
  speciality_id?: number | null;
  publish_date?: string | null;
  description?: string | null;
  status?: TestimonialStatus;
};

export type UpdateTestimonialInput = Partial<CreateTestimonialInput>;
