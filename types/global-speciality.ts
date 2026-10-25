import type { Menu, MenuPlacement } from "@/types/menu";

export type GlobalSpecialityStatus = "active" | "inactive";

export type GlobalSpeciality = {
  id: number;
  speciality_name: string;
  speciality_title: string | null;
  seo_url: string;
  short_description: string | null;
  description: string | null;
  image: string | null;
  card_icon: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keyword: string | null;
  status: GlobalSpecialityStatus;
  created_at: string;
  updated_at: string;
  linkedCityCount: number;
};

export type ListGlobalSpecialitiesFilter = {
  status?: GlobalSpecialityStatus;
};

export type CreateGlobalSpecialityInput = {
  speciality_name: string;
  speciality_title?: string | null;
  seo_url: string;
  short_description?: string | null;
  description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keyword?: string | null;
  status?: GlobalSpecialityStatus;
};

export type UpdateGlobalSpecialityInput = Partial<CreateGlobalSpecialityInput>;

/**
 * The Navigation tab's read/write shape — mirrors
 * validators/global-speciality-navigation.validator.ts's
 * globalSpecialityNavigationPlacementSchema. `GlobalSpecialityNavigationPlacement`
 * is just a `Menu` (the one row, if any, this speciality is linked from via
 * target_type: "global_speciality") — never a second type for the same shape.
 */
export type GlobalSpecialityNavigationPlacement = Menu | null;

export type GlobalSpecialityNavigationParent =
  | { mode: "top_level"; placement: MenuPlacement }
  | { mode: "existing"; parent_id: number }
  | { mode: "new_parent"; title: string; placement: MenuPlacement };

export type SetGlobalSpecialityNavigationInput =
  | { show: false }
  | {
      show: true;
      language_id: number;
      title: string;
      sorting_order?: number;
      parent: GlobalSpecialityNavigationParent;
    };
