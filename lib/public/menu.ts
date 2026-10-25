import { getMenus } from "@/services/menu.service";
import { getLanguages } from "@/services/language.service";
import { getSpecialityById } from "@/services/speciality.service";
import { getTreatmentById } from "@/services/treatment.service";
import { getHospitalById } from "@/services/hospital.service";
import { getDoctorById } from "@/services/doctor.service";
import { getDoctorSpecialityById } from "@/services/doctor-speciality.service";
import { getBlogById } from "@/services/blog.service";
import { getBlogCategoryById } from "@/services/blog-category.service";
import { getPageById } from "@/services/page.service";
import { getGlobalSpecialityById } from "@/services/global-speciality.service";
import {
  getBlogCategoryUrl,
  getBlogsUrl,
  getBlogUrl,
  getDoctorsUrl,
  getDoctorSpecialityUrl,
  getDoctorUrl,
  getFindADoctorUrl,
  getGenericPageUrl,
  getGlobalSpecialityUrl,
  getHealthPackagesUrl,
  getHospitalsUrl,
  getHospitalUrl,
  getSpecialitiesUrl,
  getSpecialityUrl,
  getTestimonialsUrl,
  getContactUsUrl,
  getTreatmentsUrl,
  getTreatmentUrl,
} from "@/lib/public/urls";
import type { MenuListingKey, MenuPlacement, MenuTargetType } from "@/types/menu";

/**
 * Maps each controlled `listing_key` to the one real URL builder for that
 * nationwide/system route, in `lib/public/urls.ts` — the single locked
 * source of truth for the public URL architecture. A "listing" menu item
 * never carries a free-text URL, only one of these keys.
 *
 * `hospitals` is the one city-scoped listing (`/{citySeoUrl}/hospitals`,
 * mirroring the hospital detail route's own nesting) — it's resolved as
 * its own case in `resolveMenuHref` below, not through this map, since
 * every other builder here takes no arguments.
 */
const LISTING_URL_BUILDERS: Record<Exclude<MenuListingKey, "hospitals">, () => string> = {
  specialities: getSpecialitiesUrl,
  treatments: getTreatmentsUrl,
  doctors: getDoctorsUrl,
  find_a_doctor: getFindADoctorUrl,
  health_packages: getHealthPackagesUrl,
  blogs: getBlogsUrl,
  testimonials: getTestimonialsUrl,
  contact_us: getContactUsUrl,
};

// `PublicMenuItem` and `splitByPlacement` live in the client-safe
// `menu-tree.ts` (no server-only imports) and are re-exported here so
// every existing Server Component import site keeps working unchanged.
// A Client Component that only needs these two should import them
// directly from `menu-tree.ts` instead of from this file — see that
// file's doc comment for why.
export type { PublicMenuItem } from "./menu-tree";
export { splitByPlacement } from "./menu-tree";
import type { PublicMenuItem } from "./menu-tree";

type FlatMenu = {
  id: number;
  parent_id: number | null;
  title: string;
  sorting_order: number;
  target_type: MenuTargetType;
  target_id: number | null;
  listing_key: MenuListingKey | null;
  placement: MenuPlacement;
};

/**
 * Resolves one menu item's target into a real public URL, exclusively
 * through the existing `lib/public/urls.ts` builders and each target
 * entity's own `getXById` service — never from the menu's own `seo_url`,
 * which is only that CMS menu row's internal identifier.
 *
 * Returns `null` whenever the link cannot be safely shown: the target
 * type is "none", the row was deleted since the menu was saved, the row
 * itself is inactive (menus.service.ts only guarantees this at save
 * time, not on an ongoing basis), or the target type isn't one this
 * function knows how to resolve. The caller drops any menu item whose
 * href comes back `null` here — this function never throws.
 */
async function resolveMenuHref(
  targetType: MenuTargetType,
  targetId: number | null,
  listingKey: MenuListingKey | null,
  citySeoUrl: string | null
): Promise<string | null> {
  if (targetType === "none") return null;

  if (targetType === "listing") {
    if (listingKey === null) return null;

    // The one city-scoped listing. A city-specific menu always has a real
    // `citySeoUrl` (see `getPublicMenuTree`'s own per-city `getMenus`
    // call). A GLOBAL menu (`city_id` null) rendering on a route with no
    // city context has no city to build this link for — dropped (`null`)
    // rather than guessing one, same "never fabricate" rule every other
    // link resolution here already follows.
    if (listingKey === "hospitals") return citySeoUrl ? getHospitalsUrl(citySeoUrl) : null;

    // Every other listing is a controlled, code-level nationwide route —
    // no CMS row to look up or go stale, so this resolves synchronously.
    return LISTING_URL_BUILDERS[listingKey]();
  }

  if (targetId === null) return null;

  try {
    switch (targetType) {
      case "speciality": {
        const speciality = await getSpecialityById(targetId);
        if (speciality.status !== "active") return null;
        return getSpecialityUrl(speciality.city.seo_url, speciality.seo_url);
      }
      case "treatment": {
        const treatment = await getTreatmentById(targetId);
        if (treatment.status !== "active") return null;
        return getTreatmentUrl(treatment.city.seo_url, treatment.seo_url);
      }
      case "hospital": {
        const hospital = await getHospitalById(targetId);
        if (hospital.status !== "active") return null;
        // Hospital is the one entity whose safe DTO keeps the raw Prisma
        // relation name `cities` (plural) instead of renaming it to
        // `city` — see the note in types/hospital.ts.
        return getHospitalUrl(hospital.cities.seo_url, hospital.seo_url);
      }
      case "doctor": {
        const doctor = await getDoctorById(targetId);
        if (doctor.status !== "active") return null;
        return getDoctorUrl(doctor.city.seo_url, doctor.seo_url);
      }
      case "doctor_speciality": {
        // A doctor taxonomy facet, not the clinical `specialities` entity
        // — nationwide, not city-scoped. See getDoctorSpecialityUrl.
        const doctorSpeciality = await getDoctorSpecialityById(targetId);
        if (doctorSpeciality.status !== "active") return null;
        return getDoctorSpecialityUrl(doctorSpeciality.seo_url);
      }
      case "blog": {
        const blog = await getBlogById(targetId);
        if (blog.blog_status !== "active") return null;
        return getBlogUrl(blog.seo_url);
      }
      case "blog_category": {
        const blogCategory = await getBlogCategoryById(targetId);
        if (blogCategory.status !== "active") return null;
        return getBlogCategoryUrl(blogCategory.seo_url);
      }
      case "page": {
        const page = await getPageById(targetId);
        if (page.status !== "active") return null;
        return getGenericPageUrl(page.seo_url);
      }
      case "global_speciality": {
        // City-independent by construction (services/menu.service.ts's
        // ensureValidTarget rejects this target type on anything but a
        // GLOBAL menu) — never built from `citySeoUrl`, exactly the
        // "never generate a city-specific URL for a global menu item"
        // guarantee this target type exists to provide.
        const globalSpeciality = await getGlobalSpecialityById(targetId);
        if (globalSpeciality.status !== "active") return null;
        return getGlobalSpecialityUrl(globalSpeciality.seo_url);
      }
      default:
        // Defensive only — the DB enum and the validator already reject
        // any value outside MenuTargetType.
        return null;
    }
  } catch {
    // The target row no longer exists (menus has no DB-level FK across
    // these tables by design — see the Menu Management architecture
    // report). A dangling reference must never surface as a broken link.
    return null;
  }
}

function buildTree(menus: (FlatMenu & { href: string | null })[]): PublicMenuItem[] {
  const byParent = new Map<number | null, (FlatMenu & { href: string | null })[]>();

  for (const menu of menus) {
    const key = menu.parent_id;
    const siblings = byParent.get(key) ?? [];
    siblings.push(menu);
    byParent.set(key, siblings);
  }

  function toItem(menu: FlatMenu & { href: string | null }): PublicMenuItem {
    return {
      id: menu.id,
      label: menu.title,
      href: menu.href,
      placement: menu.placement,
      // `menus` is already ordered [sorting_order asc, id asc] by
      // services/menu.service.ts's getMenus(), and grouping by parent_id
      // with a stable filter preserves that relative order per level —
      // no re-sort needed here.
      children: (byParent.get(menu.id) ?? []).map(toItem),
    };
  }

  return (byParent.get(null) ?? []).map(toItem);
}

/**
 * The public navbar's CMS-driven menu tree — active items only, ordered by
 * `sorting_order`, built into a parent/child tree from `parent_id`.
 *
 * Combines TWO sets of `menus` rows: GLOBAL ones (`city_id: null` —
 * available on every page, city or not, e.g. "For Patients"/"Our
 * Company") and, when a real city context exists, that city's OWN
 * city-specific rows. A child's `parent_id` can only resolve within its
 * OWN set — `ensureParentExists` (services/menu.service.ts) already
 * guarantees a global child can only parent under a global parent, and a
 * city-specific child only under a same-city parent — so the merge never
 * lets a global item appear nested under a city-specific one or vice
 * versa.
 *
 * PRIMARY NAVIGATION PRECEDENCE RULE: primary navigation (top-level items
 * with `placement: "primary"`) is consolidated to a single canonical
 * GLOBAL source of truth — e.g. "For Patients"/"Our Company" are managed
 * once, globally, not duplicated per city. A city-specific top-level
 * `primary` menu is therefore always dropped here (along with its
 * children, via the "orphaned child" rule below), even if one still
 * exists in the CMS for some city — it never reaches the public site.
 * This is a scope/placement rule, not title matching: it does not
 * compare labels, it only ever drops a row that is BOTH city-specific
 * AND top-level-primary. `secondary`/`footer` navigation is NOT subject
 * to this rule and stays fully city-specific, exactly as before (see
 * MenuFormDialog's discouragement hint for the CMS-side half of this).
 *
 * `cityId`/`citySeoUrl` must come from the actual route being rendered
 * (the resolved city behind `/{citySeoUrl}` and everything nested under
 * it), passed in by the caller — see `PublicHeader`, which resolves both
 * from the same City row. This function does not guess a city on its own.
 * `cityId: null` is for routes that genuinely have no city context (the
 * flat nationwide listings, generic CMS pages, the homepage, 404) — those
 * now still get the GLOBAL menu set (previously they got nothing at all),
 * just no city-specific rows layered on top. `citySeoUrl` is only
 * actually used to resolve the one city-scoped listing key (`hospitals`)
 * — see `resolveMenuHref`, which drops that one link (not the whole menu
 * item) when there's no city to build it for.
 *
 * Language has no per-route signal in this project (no `/en`, `/hi`, ...
 * URL prefix), so it stays auto-resolved here exactly as before — the
 * first active language from `getLanguages()`, the same service already
 * used elsewhere on the public site.
 */
export async function getPublicMenuTree({
  cityId,
  citySeoUrl,
}: {
  cityId: number | null;
  citySeoUrl: string | null;
}): Promise<PublicMenuItem[]> {
  const languages = await getLanguages();
  const defaultLanguage = languages.find((language) => language.status === "active");

  if (!defaultLanguage) {
    return [];
  }

  const [cityMenus, globalMenus] = await Promise.all([
    cityId !== null
      ? getMenus({ status: "active", language_id: defaultLanguage.id, city_id: cityId })
      : Promise.resolve([]),
    getMenus({ status: "active", language_id: defaultLanguage.id, cityIdIsNull: true }),
  ]);

  // Drop any city-specific top-level PRIMARY menu — see this function's
  // own doc comment above. Filtered out of `cityMenus` BEFORE the merge
  // (rather than after), so its children are naturally excluded too via
  // the "orphaned child" rule a few lines down, with no special-casing
  // needed there.
  const cityMenusWithoutDuplicatedPrimary = cityMenus.filter(
    (menu) => !(menu.parent_id === null && menu.placement === "primary")
  );

  // Each half was independently ordered by `getMenus()`; re-sort the
  // merged set the same way so global and city-specific top-level items
  // interleave correctly by `sorting_order` rather than all of one set
  // appearing before all of the other.
  const menus = [...cityMenusWithoutDuplicatedPrimary, ...globalMenus].sort(
    (a, b) => a.sorting_order - b.sorting_order || a.id - b.id
  );

  const withHrefs = await Promise.all(
    menus.map(async (menu) => {
      const href = await resolveMenuHref(menu.target_type, menu.target_id, menu.listing_key, citySeoUrl);
      const isBrokenEntityLink = menu.target_type !== "none" && href === null;
      return { menu, href, isBrokenEntityLink };
    })
  );

  // A menu item whose own entity target is missing/inactive/unsupported
  // is dropped entirely (never rendered as a dead label).
  const usable = withHrefs.filter((entry) => !entry.isBrokenEntityLink);
  const usableIds = new Set(usable.map((entry) => entry.menu.id));

  // A child whose `parent_id` does not resolve within this SAME
  // language/active-status-filtered set (because the referenced parent is
  // inactive, was deleted, or itself got dropped above) must never be
  // silently promoted to a top-level item. (A cross-set parent — global
  // child under a city parent or vice versa — can't occur at all: see
  // this function's own doc comment.) Promoting it would misrepresent the
  // CMS's actual hierarchy (a child rendering as if it were top-level);
  // instead it is dropped, exactly like a broken entity-target link is
  // dropped.
  const renderable = usable.filter(
    (entry) => entry.menu.parent_id === null || usableIds.has(entry.menu.parent_id)
  );

  const flat = renderable.map((entry) => ({
    id: entry.menu.id,
    parent_id: entry.menu.parent_id,
    title: entry.menu.title,
    sorting_order: entry.menu.sorting_order,
    target_type: entry.menu.target_type,
    target_id: entry.menu.target_id,
    listing_key: entry.menu.listing_key,
    placement: entry.menu.placement,
    href: entry.href,
  }));

  return buildTree(flat);
}
