import { z } from "zod";

export const menuStatusSchema = z.enum(["active", "inactive"]);

export const menuTargetTypeSchema = z.enum([
  "none",
  "speciality",
  "treatment",
  "hospital",
  "doctor",
  "doctor_speciality",
  "blog",
  "blog_category",
  "page",
  "listing",
  /** A city-independent `global_specialities` row — unlike "speciality", this target has no `city_id` at all, so it can only ever be used on a GLOBAL menu (`city_id: null`); see ensureValidTarget in services/menu.service.ts. */
  "global_speciality",
]);

/** Controlled set of nationwide/system listing routes — mirrors the `menus_listing_key` DB enum and lib/public/urls.ts. Only meaningful when target_type is "listing". */
export const menuListingKeySchema = z.enum([
  "specialities",
  "treatments",
  "hospitals",
  "doctors",
  "find_a_doctor",
  "health_packages",
  "blogs",
  "testimonials",
  "contact_us",
]);

/** Which row/region of the public navigation a top-level menu item renders in — mirrors the `menus_placement` DB enum. Only meaningful on a top-level item (`parent_id: null`); a child always renders wherever its parent renders. */
export const menuPlacementSchema = z.enum(["primary", "secondary", "footer"]);

export const menuIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listMenusQuerySchema = z.object({
  status: menuStatusSchema.optional(),
  language_id: z.coerce.number().int().positive().optional(),
  city_id: z.coerce.number().int().positive().optional(),
  /** Fetches global (`city_id IS NULL`) menus directly — used both server-side (`lib/public/menu.ts` merging a city's own menus with global ones) and via the HTTP query string (`?cityIdIsNull=true`, parsed in controllers/menu.controller.ts) by the admin Parent Menu dropdown when the menu being created/edited is itself global. Mutually exclusive with `city_id` in practice; when both are set, `cityIdIsNull` wins (see services/menu.service.ts's getMenus). */
  cityIdIsNull: z.boolean().optional(),
  parent_id: z.coerce.number().int().positive().optional(),
  placement: menuPlacementSchema.optional(),
});

export const createMenuSchema = z.object({
  language_id: z.coerce.number().int().positive(),
  title: z.string().trim().min(1, "Title is required").max(255),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255),
  sorting_order: z.coerce.number().int().optional(),
  /** `null` means a GLOBAL menu — available across all cities/global pages (see lib/public/menu.ts's getPublicMenuTree). A real id scopes the menu to exactly that city, same as before. Never silently defaulted to a city; the admin must explicitly choose one or leave it unset. */
  city_id: z.coerce.number().int().positive().nullable(),
  parent_id: z.coerce.number().int().positive().nullable().optional(),
  target_type: menuTargetTypeSchema.optional(),
  target_id: z.coerce.number().int().positive().nullable().optional(),
  listing_key: menuListingKeySchema.nullable().optional(),
  placement: menuPlacementSchema.optional(),
  status: menuStatusSchema.optional(),
});

export const updateMenuSchema = createMenuSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);

export type ListMenusQuery = z.infer<typeof listMenusQuerySchema>;
export type MenuTargetType = z.infer<typeof menuTargetTypeSchema>;
export type MenuListingKey = z.infer<typeof menuListingKeySchema>;
export type MenuPlacement = z.infer<typeof menuPlacementSchema>;
export type CreateMenuInput = z.infer<typeof createMenuSchema>;
export type UpdateMenuInput = z.infer<typeof updateMenuSchema>;
export type MenuIdParam = z.infer<typeof menuIdParamSchema>;
