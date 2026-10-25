import { z } from "zod";

export const testimonialStatusSchema = z.enum(["active", "inactive"]);

export const testimonialIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listTestimonialsQuerySchema = z.object({
  city_id: z.coerce.number().int().positive().optional(),
  doctor_id: z.coerce.number().int().positive().optional(),
  hospital_id: z.coerce.number().int().positive().optional(),
  language_id: z.coerce.number().int().positive().optional(),
  location_id: z.coerce.number().int().positive().optional(),
  speciality_id: z.coerce.number().int().positive().optional(),
  status: testimonialStatusSchema.optional(),
});

// multipart/form-data has no native null/date type — publish_date arrives
// as a plain string, or is omitted entirely. A key that's absent from the
// input means "leave unchanged" on update (handled by the outer
// .optional() short-circuiting before this ever runs); an empty string
// explicitly clears it; anything else must parse as a valid date.
const publishDateSchema = z
  .union([z.string(), z.date()])
  .nullable()
  .transform((value, ctx) => {
    if (value === null || value === "") {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "publish_date must be a valid date",
      });
      return z.NEVER;
    }

    return date;
  });

// Non-file fields only — testimonial_image is an uploaded image,
// validated separately in the upload layer using the actual file
// metadata Zod never sees here.
export const createTestimonialSchema = z.object({
  language_id: z.coerce.number().int().positive(),
  testimonial_name: z
    .string()
    .trim()
    .min(1, "Testimonial name is required")
    .max(255),
  meta_title: z.string().trim().max(255).nullable().optional(),
  meta_description: z.string().trim().nullable().optional(),
  meta_keywords: z.string().trim().max(500).nullable().optional(),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255),
  youtube_url: z.string().trim().max(500).nullable().optional(),
  city_id: z.coerce.number().int().positive(),
  location_id: z.coerce.number().int().positive().nullable().optional(),
  hospital_id: z.coerce.number().int().positive().nullable().optional(),
  doctor_id: z.coerce.number().int().positive().nullable().optional(),
  // The real clinical `specialities` FK — validated against `specialities`
  // (never doctor_specialities) in the service layer.
  speciality_id: z.coerce.number().int().positive().nullable().optional(),
  publish_date: publishDateSchema.optional(),
  // Not trimmed: LongText CMS content, stored exactly as submitted.
  description: z.string().nullable().optional(),
  status: testimonialStatusSchema.optional(),
});

// No "at least one field" refinement here: a valid PUT may legitimately
// carry no text fields at all (e.g. only replacing/clearing the image).
// The controller enforces "at least one field OR an image change"
// instead, since only it sees the parsed text fields, the uploaded file,
// and the image-clear sentinel together.
export const updateTestimonialSchema = createTestimonialSchema.partial();

export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;
export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>;
export type TestimonialIdParam = z.infer<typeof testimonialIdParamSchema>;
export type ListTestimonialsQuery = z.infer<
  typeof listTestimonialsQuerySchema
>;
