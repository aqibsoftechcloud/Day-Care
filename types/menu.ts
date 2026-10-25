export type MenuStatus = "active" | "inactive";

/** The public CMS content types a menu item can link to. "none" means the item is a grouping/dropdown parent with no direct destination. "listing" means a nationwide/system listing route (see MenuListingKey) rather than one specific CMS entity row. */
export type MenuTargetType =
  | "none"
  | "speciality"
  | "treatment"
  | "hospital"
  | "doctor"
  | "doctor_speciality"
  | "blog"
  | "blog_category"
  | "page"
  | "listing"
  /** A city-independent `global_specialities` row — see CITY_SCOPED_MENU_TARGET_TYPES below, which deliberately excludes it. */
  | "global_speciality";

/** Controlled set of nationwide/system listing routes a "listing" menu item can point at — mirrors the `menus_listing_key` DB enum and lib/public/urls.ts. Never a free-text URL. */
export type MenuListingKey =
  | "specialities"
  | "treatments"
  | "hospitals"
  | "doctors"
  | "find_a_doctor"
  | "health_packages"
  | "blogs"
  | "testimonials"
  | "contact_us";

/** Which row/region of the public navigation a top-level menu item renders in — mirrors the `menus_placement` DB enum. Only meaningful on a top-level item (`parent_id: null`); a child always renders wherever its parent renders. */
export type MenuPlacement = "primary" | "secondary" | "footer";

/** The `target_type` values whose entity has its own `city_id` in the DB — everything except `doctor_speciality` and `blog_category`, which are nationwide taxonomies. Single source of truth shared by TargetPicker (which city to filter target options by) and MenuFormDialog (whether to clear a stale target_id when the menu's own city changes). */
export const CITY_SCOPED_MENU_TARGET_TYPES: MenuTargetType[] = [
  "speciality",
  "treatment",
  "hospital",
  "doctor",
  "blog",
  "page",
];

/** Mirrors services/menu.service.ts's toSafeMenu() output — embeds `language`/`city`/`parent` (parent only, not children) alongside the raw FK scalars. `target` is resolved live for display only (never persisted, never a second source of truth) — `null` when target_type is "none" or the referenced row/route no longer exists. */
export type Menu = {
  id: number;
  language_id: number;
  title: string;
  seo_url: string;
  sorting_order: number;
  /** `null` = a GLOBAL menu, available across all cities/global pages — not scoped to any single one. */
  city_id: number | null;
  parent_id: number | null;
  target_type: MenuTargetType;
  target_id: number | null;
  listing_key: MenuListingKey | null;
  placement: MenuPlacement;
  status: MenuStatus;
  created_at: string;
  updated_at: string;
  language: { id: number; name: string };
  city: { id: number; city_name: string } | null;
  parent: { id: number; title: string } | null;
  target: { type: MenuTargetType; id: number | null; label: string; status: string } | null;
};

/** Mirrors validators/menu.validator.ts's createMenuSchema. */
export type CreateMenuInput = {
  language_id: number;
  title: string;
  seo_url: string;
  sorting_order?: number;
  /** `null` creates a GLOBAL menu (no city). A real id scopes it to that city, same as before. */
  city_id: number | null;
  parent_id?: number | null;
  target_type?: MenuTargetType;
  target_id?: number | null;
  listing_key?: MenuListingKey | null;
  placement?: MenuPlacement;
  status?: MenuStatus;
};

export type UpdateMenuInput = Partial<CreateMenuInput>;

export type ListMenusFilter = {
  status?: MenuStatus;
  language_id?: number;
  city_id?: number;
  /** Fetches only GLOBAL menus (`city_id IS NULL`) — used by the Parent Menu dropdown when the menu being created/edited is itself global. Mutually exclusive with `city_id`; omit `city_id` when using this. */
  cityIdIsNull?: boolean;
  parent_id?: number;
  placement?: MenuPlacement;
};
