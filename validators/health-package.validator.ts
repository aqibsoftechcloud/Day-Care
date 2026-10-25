import { z } from "zod";

export const healthPackageStatusSchema = z.enum(["active", "inactive"]);

export const healthPackageIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listHealthPackagesQuerySchema = z.object({
  status: healthPackageStatusSchema.optional(),
});

// Accepts a plain number or a numeric string; passed through to Prisma
// as-is (no rounding/truncation) and let the DB's own DECIMAL(10,2)
// column enforce precision/scale.
const decimalInputSchema = z.union([
  z.number(),
  z.string().regex(/^-?\d+(\.\d+)?$/, "Must be a valid decimal number"),
]);

// Non-file fields only — pack_image is an uploaded image, validated
// separately in the upload layer using the actual file metadata Zod
// never sees here.
//
// package_file is NOT treated as an upload: it isn't named as an image
// (unlike pack_image, or every other *_image field in this schema), and
// the only upload validation this project reuses is image-MIME-only.
// Forcing a package_file (almost certainly a brochure/PDF) through an
// image-only filter would be wrong, and adding new MIME types wasn't
// authorized. It's accepted here as a plain string reference instead.
export const createHealthPackageSchema = z.object({
  package_title: z
    .string()
    .trim()
    .min(1, "Package title is required")
    .max(255),
  meta_title: z.string().trim().max(255).nullable().optional(),
  meta_description: z.string().trim().nullable().optional(),
  meta_keywords: z.string().trim().max(500).nullable().optional(),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255),
  cost: decimalInputSchema.optional(),
  package_file: z.string().trim().max(500).nullable().optional(),
  // Not trimmed: LongText CMS content, stored exactly as submitted.
  package_inclusions: z.string().nullable().optional(),
  status: healthPackageStatusSchema.optional(),
});

// No "at least one field" refinement here: a valid PUT may legitimately
// carry no text fields at all (e.g. only replacing/clearing pack_image).
// The controller enforces "at least one field OR an image change"
// instead, since only it sees the parsed text fields, the uploaded file,
// and the image-clear sentinel together.
export const updateHealthPackageSchema = createHealthPackageSchema.partial();

export type CreateHealthPackageInput = z.infer<
  typeof createHealthPackageSchema
>;
export type UpdateHealthPackageInput = z.infer<
  typeof updateHealthPackageSchema
>;
export type HealthPackageIdParam = z.infer<typeof healthPackageIdParamSchema>;
export type ListHealthPackagesQuery = z.infer<
  typeof listHealthPackagesQuerySchema
>;
