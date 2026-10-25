import { z } from "zod";

export const pageStatusSchema = z.enum(["active", "inactive"]);

/** Where the page links from in the public footer (Footer Settings controls the rest). */
export const pageFooterPlacementSchema = z.enum(["company", "legal", "hidden"]);

/** `global` = city-independent (stored as city_id NULL); `city` = tied to one real city. */
export const pageScopeSchema = z.enum(["global", "city"]);

export const pageIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listPagesQuerySchema = z.object({
  city_id: z.coerce.number().int().positive().optional(),
  /** Narrow the list to global pages or city-specific pages. */
  scope: pageScopeSchema.optional(),
  status: pageStatusSchema.optional(),
});

const pageBaseSchema = z.object({
  language_id: z.coerce.number().int().positive(),
  title: z.string().trim().min(1, "Title is required").max(255),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255),
  meta_title: z.string().trim().max(255).nullable().optional(),
  meta_description: z.string().trim().nullable().optional(),
  meta_keyword: z.string().trim().max(500).nullable().optional(),
  category: z.string().trim().min(1, "Category is required").max(100),
  scope: pageScopeSchema,
  // Required for a city page, must be absent for a global one (see the scope check below).
  city_id: z.coerce.number().int().positive().nullable().optional(),
  // Optional in the actual schema (`location_id Int?`) — a city page may not
  // be tied to a specific location. Never allowed on a global page.
  location_id: z.coerce.number().int().positive().nullable().optional(),
  // Optional in the actual schema (`body String? @db.LongText`). Not
  // trimmed: this is CMS page content, not an identifier field, and it
  // must be stored exactly as submitted.
  body: z.string().nullable().optional(),
  status: pageStatusSchema.optional(),
  footer_placement: pageFooterPlacementSchema.optional(),
});

type ScopeFields = { scope?: "global" | "city"; city_id?: number | null; location_id?: number | null };

/**
 * The scope contract. `requireCityOnCity` is true on create (a city page
 * must name its city) and false on update (the stored city is the fallback;
 * the service enforces that one exists).
 */
function checkScope(data: ScopeFields, ctx: z.RefinementCtx, requireCityOnCity: boolean) {
  if (data.scope === "global") {
    if (data.city_id != null) {
      ctx.addIssue({ code: "custom", path: ["city_id"], message: "A global page cannot have a city" });
    }
    if (data.location_id != null) {
      ctx.addIssue({ code: "custom", path: ["location_id"], message: "A global page cannot have a location" });
    }
  }

  if (data.scope === "city" && requireCityOnCity && data.city_id == null) {
    ctx.addIssue({ code: "custom", path: ["city_id"], message: "City is required for a city-specific page" });
  }
}

export const createPageSchema = pageBaseSchema.superRefine((data, ctx) => checkScope(data, ctx, true));

export const updatePageSchema = pageBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" })
  .superRefine((data, ctx) => checkScope(data, ctx, false));

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
export type PageScope = z.infer<typeof pageScopeSchema>;
export type PageIdParam = z.infer<typeof pageIdParamSchema>;
export type ListPagesQuery = z.infer<typeof listPagesQuerySchema>;
