import { z } from "zod";

export const newsMediaStatusSchema = z.enum(["active", "inactive"]);

export const newsMediaIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listNewsMediaQuerySchema = z.object({
  status: newsMediaStatusSchema.optional(),
});

// multipart/form-data has no native null/date type — `date` arrives as a
// plain string, or is omitted entirely. A key absent from the input
// means "leave unchanged" on update (handled by the outer .optional()
// short-circuiting before this ever runs); an empty string explicitly
// clears it; anything else must parse as a valid date. Same convention
// as Testimonials' publish_date.
const nullableDateSchema = z
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
        message: "date must be a valid date",
      });
      return z.NEVER;
    }

    return date;
  });

// Non-file fields only — view_image is an uploaded image, validated
// separately in the upload layer using the actual file metadata Zod
// never sees here. view_link is a plain URL string, not an upload
// (despite the name) — it's meant to hold an external link, not a
// stored file path.
export const createNewsMediaSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  location: z.string().trim().max(255).nullable().optional(),
  date: nullableDateSchema.optional(),
  view_link: z.string().trim().max(500).nullable().optional(),
  status: newsMediaStatusSchema.optional(),
});

// No "at least one field" refinement here: a valid PUT may legitimately
// carry no text fields at all (e.g. only replacing/clearing view_image).
// The controller enforces "at least one field OR an image change"
// instead, since only it sees the parsed text fields, the uploaded file,
// and the image-clear sentinel together.
export const updateNewsMediaSchema = createNewsMediaSchema.partial();

export type CreateNewsMediaInput = z.infer<typeof createNewsMediaSchema>;
export type UpdateNewsMediaInput = z.infer<typeof updateNewsMediaSchema>;
export type NewsMediaIdParam = z.infer<typeof newsMediaIdParamSchema>;
export type ListNewsMediaQuery = z.infer<typeof listNewsMediaQuerySchema>;
