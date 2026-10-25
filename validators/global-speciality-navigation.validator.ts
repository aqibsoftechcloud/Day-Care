import { z } from "zod";
import { menuPlacementSchema } from "@/validators/menu.validator";

/**
 * The Global Speciality form's Navigation tab writes exactly ONE `menus`
 * row per global speciality (`target_type: "global_speciality"`,
 * `target_id: <this speciality's id>`, always `city_id: null`) — see
 * services/menu.service.ts's setGlobalSpecialityNavigationPlacement.
 *
 * `show: false` means "hidden" — any existing linked menu row is
 * deactivated (soft delete, same convention as deleteMenu), never
 * removed. `show: true` carries everything needed to create-or-update
 * that one row, including which of the three ways to place it the admin
 * picked (mirrors the Navigation tab's own "Add to Existing Menu" /
 * "Create a New Menu" / implicit top-level options).
 */
export const globalSpecialityNavigationPlacementSchema = z.discriminatedUnion("show", [
  z.object({ show: z.literal(false) }),
  z.object({
    show: z.literal(true),
    language_id: z.coerce.number().int().positive(),
    title: z.string().trim().min(1, "Menu label is required").max(255, "Menu label is too long"),
    sorting_order: z.coerce.number().int().optional().default(0),
    parent: z.discriminatedUnion("mode", [
      // No parent — this speciality becomes a new top-level global item.
      z.object({ mode: z.literal("top_level"), placement: menuPlacementSchema }),
      // Nested under an existing, already-configured global parent menu.
      z.object({ mode: z.literal("existing"), parent_id: z.coerce.number().int().positive() }),
      // A brand-new parent menu is created in the same transaction, with
      // this speciality as its first child.
      z.object({
        mode: z.literal("new_parent"),
        title: z.string().trim().min(1, "Parent menu title is required").max(255, "Parent menu title is too long"),
        placement: menuPlacementSchema,
      }),
    ]),
  }),
]);

export type GlobalSpecialityNavigationPlacementInput = z.infer<typeof globalSpecialityNavigationPlacementSchema>;
