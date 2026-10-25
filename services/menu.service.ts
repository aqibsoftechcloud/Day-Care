import { prisma } from "@/lib/prisma";
import type {
  CreateMenuInput,
  ListMenusQuery,
  MenuListingKey,
  MenuPlacement,
  MenuTargetType,
  UpdateMenuInput,
} from "@/validators/menu.validator";
import { getSpecialityById } from "@/services/speciality.service";
import { getTreatmentById } from "@/services/treatment.service";
import { getHospitalById } from "@/services/hospital.service";
import { getDoctorById } from "@/services/doctor.service";
import { getDoctorSpecialityById } from "@/services/doctor-speciality.service";
import { getBlogById } from "@/services/blog.service";
import { getBlogCategoryById } from "@/services/blog-category.service";
import { getPageById } from "@/services/page.service";
import { getGlobalSpecialityById } from "@/services/global-speciality.service";
import type { GlobalSpecialityNavigationPlacementInput } from "@/validators/global-speciality-navigation.validator";

export class MenuNotFoundError extends Error {
  constructor(id: number) {
    super(`Menu with id ${id} not found`);
    this.name = "MenuNotFoundError";
  }
}

export class LanguageNotFoundError extends Error {
  constructor(languageId: number) {
    super(`Language with id ${languageId} not found`);
    this.name = "LanguageNotFoundError";
  }
}

export class CityNotFoundError extends Error {
  constructor(cityId: number) {
    super(`City with id ${cityId} not found`);
    this.name = "CityNotFoundError";
  }
}

export class ParentMenuNotFoundError extends Error {
  constructor(parentId: number) {
    super(`Parent menu with id ${parentId} not found`);
    this.name = "ParentMenuNotFoundError";
  }
}

/** The chosen parent belongs to a different city than the menu itself — the exact bug class that let Mumbai's "AboutUS" attach to Hyderabad's "For Patients". Rejected outright, mirroring MenuTargetCityMismatchError's role for entity targets. */
export class ParentMenuCityMismatchError extends Error {
  constructor(parentId: number) {
    super(`Parent menu with id ${parentId} belongs to a different city than this menu item`);
    this.name = "ParentMenuCityMismatchError";
  }
}

export class InvalidParentMenuError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidParentMenuError";
  }
}

export class MenuHasActiveChildrenError extends Error {
  constructor(id: number) {
    super(
      `Menu with id ${id} has active child menus and cannot be deactivated until they are reassigned or deactivated first`
    );
    this.name = "MenuHasActiveChildrenError";
  }
}

/** target_type/target_id shape is structurally invalid, e.g. target_id set while target_type is "none", or missing while target_type is an entity type. */
export class InvalidMenuTargetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidMenuTargetError";
  }
}

/** target_type/target_id point at a row that doesn't exist in the referenced CMS table. */
export class MenuTargetNotFoundError extends Error {
  constructor(targetType: MenuTargetType, targetId: number) {
    super(`No ${targetType.replace("_", " ")} exists with id ${targetId}`);
    this.name = "MenuTargetNotFoundError";
  }
}

/** An active menu item cannot point at a target that is itself inactive. */
export class InactiveMenuTargetError extends Error {
  constructor(targetType: MenuTargetType, targetId: number) {
    super(
      `The ${targetType.replace("_", " ")} with id ${targetId} is inactive and cannot be linked from an active menu item`
    );
    this.name = "InactiveMenuTargetError";
  }
}

/** A city-scoped target (Speciality/Treatment/Hospital/Doctor/Blog/Page) belongs to a different city than the menu item itself — the exact class of bug that let a Hyderabad menu point at a Mumbai Page. */
export class MenuTargetCityMismatchError extends Error {
  constructor(targetType: MenuTargetType, targetId: number) {
    super(
      `The ${targetType.replace("_", " ")} with id ${targetId} belongs to a different city than this menu item`
    );
    this.name = "MenuTargetCityMismatchError";
  }
}

const menuSelect = {
  id: true,
  language_id: true,
  title: true,
  seo_url: true,
  sorting_order: true,
  city_id: true,
  parent_id: true,
  target_type: true,
  target_id: true,
  listing_key: true,
  placement: true,
  status: true,
  created_at: true,
  updated_at: true,
  languages: { select: { id: true, name: true } },
  cities: { select: { id: true, city_name: true } },
  menus: { select: { id: true, title: true } },
} as const;

type MenuRecord = {
  id: number;
  language_id: number;
  title: string;
  seo_url: string;
  sorting_order: number;
  /** `null` = a GLOBAL menu, available across all cities. */
  city_id: number | null;
  parent_id: number | null;
  target_type: MenuTargetType;
  target_id: number | null;
  listing_key: MenuListingKey | null;
  placement: MenuPlacement;
  status: string;
  created_at: Date;
  updated_at: Date;
  languages: { id: number; name: string };
  cities: { id: number; city_name: string } | null;
  menus: { id: number; title: string } | null;
};

/** Human labels for the controlled "listing" routes — mirrors lib/public/urls.ts's nationwide/system listing builders. Used only for admin display; the public site resolves the actual href separately in lib/public/menu.ts. */
export const LISTING_KEY_LABELS: Record<MenuListingKey, string> = {
  specialities: "Specialities",
  treatments: "Treatments",
  hospitals: "Hospitals",
  doctors: "Doctors",
  find_a_doctor: "Find a Doctor",
  health_packages: "Health Packages",
  blogs: "Blogs",
  testimonials: "Patient Reviews",
  contact_us: "Contact Us",
};

/**
 * Resolves a menu's target into a display label + the target's own status
 * + (for the city-scoped entity types) the target's own `city_id`, or
 * `null` if the type is "none" or the referenced row no longer exists
 * (there is no DB foreign key across these tables — a target CMS row can be
 * deleted independently of any menu that still references it). Never
 * throws, so a stale/dangling reference degrades a single menu's display
 * instead of breaking the whole list.
 *
 * `cityId` is `null` for "listing" (a code-level route, not a city-scoped
 * row) and for the two nationwide taxonomies (`doctor_speciality`,
 * `blog_category`, neither of which has a `city_id` column) — callers must
 * only enforce a city match when `cityId` is non-null.
 */
async function resolveTarget(
  targetType: MenuTargetType,
  targetId: number | null,
  listingKey: MenuListingKey | null
): Promise<{ label: string; status: string; cityId: number | null } | null> {
  if (targetType === "none") return null;

  if (targetType === "listing") {
    // A code-level route, not a CMS row — always "active" as long as a
    // key is set; there is nothing in the DB whose status to check.
    return listingKey === null
      ? null
      : { label: LISTING_KEY_LABELS[listingKey], status: "active", cityId: null };
  }

  if (targetId === null) return null;

  try {
    switch (targetType) {
      case "speciality": {
        const r = await getSpecialityById(targetId);
        return { label: r.speciality_title?.trim() || r.speciality_name, status: r.status, cityId: r.city_id };
      }
      case "treatment": {
        const r = await getTreatmentById(targetId);
        return {
          label: r.sub_speciality_title?.trim() || r.sub_speciality_name,
          status: r.status,
          cityId: r.city_id,
        };
      }
      case "hospital": {
        const r = await getHospitalById(targetId);
        return { label: r.hospital_name, status: r.status, cityId: r.city_id };
      }
      case "doctor": {
        const r = await getDoctorById(targetId);
        return { label: r.doctor_name, status: r.status, cityId: r.city_id };
      }
      case "doctor_speciality": {
        const r = await getDoctorSpecialityById(targetId);
        return { label: r.speciality_name, status: r.status, cityId: null };
      }
      case "blog": {
        const r = await getBlogById(targetId);
        return { label: r.blog_title, status: r.blog_status, cityId: r.city_id };
      }
      case "blog_category": {
        const r = await getBlogCategoryById(targetId);
        return { label: r.category_name, status: r.status, cityId: null };
      }
      case "page": {
        const r = await getPageById(targetId);
        return { label: r.title, status: r.status, cityId: r.city_id };
      }
      case "global_speciality": {
        const r = await getGlobalSpecialityById(targetId);
        return { label: r.speciality_title?.trim() || r.speciality_name, status: r.status, cityId: null };
      }
    }
  } catch {
    return null;
  }
}

async function toSafeMenu(menu: MenuRecord) {
  const { languages, cities, menus, target_type, target_id, listing_key, ...rest } = menu;
  const resolved = await resolveTarget(target_type, target_id, listing_key);

  return {
    ...rest,
    target_type,
    target_id,
    listing_key,
    language: languages,
    city: cities,
    parent: menus,
    /** Convenience for the admin UI — never a second source of truth: only a label/status resolved live from the referenced CMS row/route, never persisted. */
    target: resolved ? { type: target_type, id: target_id, label: resolved.label, status: resolved.status } : null,
  };
}

async function ensureLanguageExists(languageId: number) {
  const language = await prisma.languages.findUnique({
    where: { id: languageId },
  });

  if (!language) {
    throw new LanguageNotFoundError(languageId);
  }
}

/** `cityId: null` means the menu is GLOBAL — nothing to verify, never a check that silently passes a fake/default city. */
async function ensureCityExists(cityId: number | null) {
  if (cityId === null) return;

  const city = await prisma.cities.findUnique({ where: { id: cityId } });

  if (!city) {
    throw new CityNotFoundError(cityId);
  }
}

/**
 * Verifies the proposed parent exists AND belongs to the SAME city as the
 * menu item that will reference it. This is the authoritative,
 * server-side half of the parent city-scoping guarantee — the admin UI's
 * Parent Menu dropdown filtering by city is the other half, but this
 * check is what actually makes a cross-city parent relationship
 * impossible even if that UI filtering were ever bypassed (a direct API
 * call, a future regression, etc.), mirroring how ensureValidTarget
 * already does the same for entity targets. `menuCityId: null` (a global
 * menu) is just another city value for this comparison's purposes — a
 * global child can only parent under a global parent (`null === null`),
 * exactly mirroring how a Hyderabad child can only parent under a
 * Hyderabad parent. No special-casing needed.
 */
async function ensureParentExists(parentId: number, menuCityId: number | null) {
  const parent = await prisma.menus.findUnique({
    where: { id: parentId },
    select: { city_id: true },
  });

  if (!parent) {
    throw new ParentMenuNotFoundError(parentId);
  }

  if (parent.city_id !== menuCityId) {
    throw new ParentMenuCityMismatchError(parentId);
  }
}

/**
 * Structural + referential validation for a menu's final (post-merge)
 * target_type/target_id/listing_key/status combination:
 * - "none" must carry neither a target_id nor a listing_key.
 * - "listing" must carry a listing_key and no target_id (it is a
 *   code-level route, not a CMS row, so there is nothing to look up).
 * - Any entity type must carry a target_id that resolves to a real row,
 *   and no listing_key.
 * - An active menu item cannot reference an inactive entity target.
 * - A city-scoped entity target (everything except doctor_speciality and
 *   blog_category, which are nationwide taxonomies) must belong to the
 *   SAME city as the menu item itself — this is the authoritative,
 *   server-side half of the city-scoping guarantee; the admin UI's Target
 *   picker filtering by city is the other half, but this check is what
 *   actually makes a cross-city save impossible even if that UI filtering
 *   were ever bypassed (a direct API call, a future regression, etc.).
 *   This is also what correctly stops a GLOBAL menu (`menuCityId: null`)
 *   from targeting any city-scoped entity at all: `resolved.cityId` is
 *   always a real number for those types, which can never equal `null`,
 *   so the mismatch check rejects it the same way it would reject a
 *   cross-city mismatch — a global menu can only use `target_type`
 *   "none", "listing", "doctor_speciality", or "blog_category" (the
 *   nationwide-safe types), with zero special-casing required here.
 */
async function ensureValidTarget(
  targetType: MenuTargetType,
  targetId: number | null,
  listingKey: MenuListingKey | null,
  menuWillBeActive: boolean,
  menuCityId: number | null
) {
  if (targetType === "none") {
    if (targetId !== null || listingKey !== null) {
      throw new InvalidMenuTargetError(
        "target_id/listing_key must not be set when target_type is 'none'"
      );
    }
    return;
  }

  if (targetType === "listing") {
    if (targetId !== null) {
      throw new InvalidMenuTargetError(
        "target_id must not be set when target_type is 'listing'"
      );
    }
    if (listingKey === null) {
      throw new InvalidMenuTargetError(
        "listing_key is required when target_type is 'listing'"
      );
    }
    return;
  }

  if (listingKey !== null) {
    throw new InvalidMenuTargetError(
      "listing_key must not be set unless target_type is 'listing'"
    );
  }

  if (targetId === null) {
    throw new InvalidMenuTargetError(
      `target_id is required when target_type is '${targetType}'`
    );
  }

  // A `global_speciality` target is, by definition, city-independent — it
  // makes no sense for a CITY-specific menu to carry one (that menu would
  // still only ever resolve to the global `/dcg/{seoUrl}` page, never a
  // city-scoped URL). Rejected structurally here, before even resolving
  // the target, the same way "none"/"listing" are rejected structurally
  // above — this is what makes the admin Navigation tab's own invariant
  // (it only ever creates GLOBAL menus) authoritative server-side too.
  if (targetType === "global_speciality" && menuCityId !== null) {
    throw new InvalidMenuTargetError(
      "A 'global_speciality' link can only be used on a GLOBAL menu (no city)"
    );
  }

  const resolved = await resolveTarget(targetType, targetId, null);

  if (!resolved) {
    throw new MenuTargetNotFoundError(targetType, targetId);
  }

  if (menuWillBeActive && resolved.status !== "active") {
    throw new InactiveMenuTargetError(targetType, targetId);
  }

  if (resolved.cityId !== null && resolved.cityId !== menuCityId) {
    throw new MenuTargetCityMismatchError(targetType, targetId);
  }
}

/**
 * Walks the proposed parent's ancestor chain to make sure `id` does not
 * appear in it, which would otherwise create a circular hierarchy.
 */
async function ensureNoCycle(id: number, parentId: number) {
  if (parentId === id) {
    throw new InvalidParentMenuError("A menu cannot be its own parent");
  }

  let currentId: number | null = parentId;
  const visited = new Set<number>();

  while (currentId !== null) {
    if (currentId === id) {
      throw new InvalidParentMenuError(
        "Invalid parent: this would create a circular menu hierarchy"
      );
    }

    if (visited.has(currentId)) break;
    visited.add(currentId);

    const current: { parent_id: number | null } | null =
      await prisma.menus.findUnique({
        where: { id: currentId },
        select: { parent_id: true },
      });

    currentId = current?.parent_id ?? null;
  }
}

async function ensureNoActiveChildren(id: number) {
  const activeChild = await prisma.menus.findFirst({
    where: { parent_id: id, status: "active" },
    select: { id: true },
  });

  if (activeChild) {
    throw new MenuHasActiveChildrenError(id);
  }
}

export async function getMenus(filter?: ListMenusQuery) {
  const menus = await prisma.menus.findMany({
    where: {
      ...(filter?.status !== undefined ? { status: filter.status } : {}),
      ...(filter?.language_id !== undefined ? { language_id: filter.language_id } : {}),
      // `cityIdIsNull` (fetch GLOBAL menus) takes precedence over `city_id`
      // when both happen to be set — the two are mutually exclusive filter
      // intents in practice (see ListMenusQuery's own doc comment).
      ...(filter?.cityIdIsNull
        ? { city_id: null }
        : filter?.city_id !== undefined
          ? { city_id: filter.city_id }
          : {}),
      ...(filter?.parent_id !== undefined ? { parent_id: filter.parent_id } : {}),
      ...(filter?.placement !== undefined ? { placement: filter.placement } : {}),
    },
    select: menuSelect,
    orderBy: [{ sorting_order: "asc" }, { id: "asc" }],
  });

  return Promise.all(menus.map(toSafeMenu));
}

export async function getMenuById(id: number) {
  const menu = await prisma.menus.findUnique({
    where: { id },
    select: menuSelect,
  });

  if (!menu) {
    throw new MenuNotFoundError(id);
  }

  return toSafeMenu(menu);
}

export async function createMenu(data: CreateMenuInput) {
  await ensureLanguageExists(data.language_id);
  await ensureCityExists(data.city_id);

  if (data.parent_id != null) {
    await ensureParentExists(data.parent_id, data.city_id);
  }

  const targetType = data.target_type ?? "none";
  const targetId = targetType === "none" || targetType === "listing" ? null : data.target_id ?? null;
  const listingKey = targetType === "listing" ? data.listing_key ?? null : null;
  const status = data.status ?? "active";

  await ensureValidTarget(targetType, targetId, listingKey, status === "active", data.city_id);

  const menu = await prisma.menus.create({
    data: { ...data, target_type: targetType, target_id: targetId, listing_key: listingKey },
    select: menuSelect,
  });

  return toSafeMenu(menu);
}

export async function updateMenu(id: number, data: UpdateMenuInput) {
  const existing = await prisma.menus.findUnique({
    where: { id },
    select: { target_type: true, target_id: true, listing_key: true, status: true, city_id: true },
  });

  if (!existing) {
    throw new MenuNotFoundError(id);
  }

  if (data.language_id !== undefined) {
    await ensureLanguageExists(data.language_id);
  }

  if (data.city_id !== undefined) {
    await ensureCityExists(data.city_id);
  }

  // Computed before the parent check below so a mismatched city can be
  // caught against the menu's FINAL city (whether just-submitted or
  // inherited from the existing row), not the pre-update one.
  const cityId = data.city_id ?? existing.city_id;

  if (data.parent_id !== undefined && data.parent_id !== null) {
    await ensureParentExists(data.parent_id, cityId);
    await ensureNoCycle(id, data.parent_id);
  }

  const targetType = data.target_type ?? existing.target_type;
  const targetId =
    targetType === "none" || targetType === "listing"
      ? null
      : data.target_id !== undefined
        ? data.target_id
        : existing.target_id;
  const listingKey =
    targetType === "listing"
      ? data.listing_key !== undefined
        ? data.listing_key
        : existing.listing_key
      : null;
  const status = data.status ?? existing.status;

  await ensureValidTarget(targetType, targetId, listingKey, status === "active", cityId);

  const menu = await prisma.menus.update({
    where: { id },
    data: { ...data, target_type: targetType, target_id: targetId, listing_key: listingKey, updated_at: new Date() },
    select: menuSelect,
  });

  return toSafeMenu(menu);
}

/**
 * Soft delete: deactivates the menu by setting status to "inactive".
 * Refuses to deactivate a menu that still has active children, to avoid
 * silently orphaning them under an inactive parent — the caller must
 * reassign or deactivate the children first.
 */
export async function deleteMenu(id: number) {
  await getMenuById(id);
  await ensureNoActiveChildren(id);

  await prisma.menus.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}

function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "menu";
}

/** Appends `-2`, `-3`, ... until the candidate `seo_url` is free — `menus.seo_url` is unique across the WHOLE table, so an auto-derived slug (never admin-typed, see the Navigation tab) must self-resolve collisions instead of surfacing a raw unique-constraint error. */
async function uniqueMenuSeoUrl(
  tx: Pick<typeof prisma, "menus">,
  base: string,
  excludeId?: number
): Promise<string> {
  let candidate = base;
  for (let suffix = 2; ; suffix++) {
    const clash = await tx.menus.findUnique({ where: { seo_url: candidate }, select: { id: true } });
    if (!clash || clash.id === excludeId) return candidate;
    candidate = `${base}-${suffix}`;
  }
}

/**
 * The Navigation tab's "current configuration" read — the one `menus`
 * row (if any) with `target_type: "global_speciality"` pointing at this
 * speciality, GLOBAL by construction. Returns `null` when the admin has
 * never configured navigation for it (not yet created) or has hidden it
 * (deactivated, not deleted — see setGlobalSpecialityNavigationPlacement).
 */
export async function getGlobalSpecialityNavigationPlacement(globalSpecialityId: number) {
  const menu = await prisma.menus.findFirst({
    where: { target_type: "global_speciality", target_id: globalSpecialityId },
    select: menuSelect,
  });

  return menu ? toSafeMenu(menu) : null;
}

/**
 * Creates, updates, or hides the ONE `menus` row representing this global
 * speciality's placement in global navigation — the Navigation tab's
 * entire write path. Always GLOBAL (`city_id: null`); never creates a
 * second row for the same speciality (finds-or-creates by
 * `target_type`+`target_id`, so "prevent duplicate placement" holds by
 * construction, not by a separate check).
 *
 * `show: false` deactivates the existing row (soft delete, same
 * convention as deleteMenu) without touching the speciality's own
 * content. `parent.mode: "new_parent"` creates the new top-level parent
 * AND this speciality's child row together in one transaction — if the
 * child insert fails for any reason, the just-created parent is rolled
 * back too, never left as an orphaned empty menu.
 */
export async function setGlobalSpecialityNavigationPlacement(
  globalSpecialityId: number,
  input: GlobalSpecialityNavigationPlacementInput
) {
  const globalSpeciality = await getGlobalSpecialityById(globalSpecialityId); // throws GlobalSpecialityNotFoundError if missing

  const existing = await prisma.menus.findFirst({
    where: { target_type: "global_speciality", target_id: globalSpecialityId },
    select: { id: true, seo_url: true, status: true },
  });

  if (!input.show) {
    if (existing && existing.status === "active") {
      await prisma.menus.update({ where: { id: existing.id }, data: { status: "inactive", updated_at: new Date() } });
    }
    return null;
  }

  await ensureLanguageExists(input.language_id);

  if (input.parent.mode === "existing") {
    // Must itself be a GLOBAL, top-level menu — ensureParentExists already
    // enforces "same city as the child" (null === null here), which is
    // exactly "must be global"; a non-top-level parent is still a valid
    // nesting target (grandchildren are allowed elsewhere in this
    // system), so no additional "must be top-level" check is added here.
    await ensureParentExists(input.parent.parent_id, null);
    if (existing) {
      await ensureNoCycle(existing.id, input.parent.parent_id);
    }
  }

  return prisma.$transaction(async (tx) => {
    let parentId: number | null = null;
    let placement: MenuPlacement = "primary";

    if (input.parent.mode === "new_parent") {
      const parentSeoUrl = await uniqueMenuSeoUrl(tx, `menu-${slugify(input.parent.title)}-global`);
      const newParent = await tx.menus.create({
        data: {
          language_id: input.language_id,
          title: input.parent.title,
          seo_url: parentSeoUrl,
          city_id: null,
          parent_id: null,
          target_type: "none",
          placement: input.parent.placement,
          status: "active",
        },
      });
      parentId = newParent.id;
      placement = input.parent.placement;
    } else if (input.parent.mode === "existing") {
      parentId = input.parent.parent_id;
    } else {
      placement = input.parent.placement;
    }

    if (existing) {
      const updated = await tx.menus.update({
        where: { id: existing.id },
        data: {
          language_id: input.language_id,
          title: input.title,
          parent_id: parentId,
          placement,
          sorting_order: input.sorting_order,
          status: "active",
          updated_at: new Date(),
        },
        select: menuSelect,
      });
      return toSafeMenu(updated);
    }

    const seoUrl = await uniqueMenuSeoUrl(tx, `menu-${slugify(globalSpeciality.seo_url)}-global`);

    const created = await tx.menus.create({
      data: {
        language_id: input.language_id,
        title: input.title,
        seo_url: seoUrl,
        city_id: null,
        parent_id: parentId,
        target_type: "global_speciality",
        target_id: globalSpecialityId,
        placement,
        sorting_order: input.sorting_order,
        status: "active",
      },
      select: menuSelect,
    });
    return toSafeMenu(created);
  });
}
