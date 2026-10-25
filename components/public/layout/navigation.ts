import { prisma } from "@/lib/prisma";
import {
  getSpecialityUrl,
  getTreatmentUrl,
  getHospitalUrl,
  getSpecialitiesUrl,
  getTreatmentsUrl,
  getGlobalSpecialityUrl,
  getGlobalTreatmentUrl,
} from "@/lib/public/urls";
import type { PublicMenuItem } from "@/lib/public/menu-tree";

export interface NavTreatmentItem {
  id: number;
  name: string;
  href: string;
}

export interface NavSpecialityItem {
  id: number;
  title: string;
  /** Real `specialities.short_description` (same field `lib/public/specialities.ts` already exposes) — shown as the secondary line in the mobile nav drawer's "Our Specialities" list. `null` when the admin hasn't set one. */
  shortDescription: string | null;
  href: string;
  treatments: NavTreatmentItem[];
}

/**
 * ROW 2 (the Speciality navigation row, `SecondaryNavBar`) has exactly
 * ONE source of truth on any given page: on a page with NO city context,
 * that's this function's own merged output; on a CITY page, it's
 * `getPublicNavSpecialities()` alone, UNMERGED — PublicHeader.tsx only
 * calls this function when `currentCityId === null`. A `menus` row
 * placed in `secondary` is a GLOBAL (`city_id: null`) CMS configuration
 * (Menu Management / the Global Speciality Navigation tab); merging it
 * into a CITY page's Row 2 was the exact duplication bug this guards
 * against now — a city speciality's own href (e.g.
 * `/hyderabad/specialities/general-surgery`) never equals its global
 * counterpart's href (`/dcg/general-surgery`), so comparing them for dedup
 * on a city page let BOTH through, and a purely global entity with no
 * city row at all (e.g. Neurosurgery) leaked in with zero relevance to
 * that city. On a no-city page, every `getPublicNavSpecialities` entry
 * is ALREADY resolved to its own `/dcg/{seoUrl}` global href (see that
 * function's own doc comment), so comparing by href there correctly
 * recognizes "the same destination" — which is this function's actual
 * job: merge in only the `secondary`-placement CMS menu items whose
 * resolved destination ISN'T already reachable through an existing
 * entry, never a true duplicate. Deliberately compared by resolved
 * `href`, not by target type/id or any hardcoded name/slug — this
 * holds regardless of which CMS mechanism produced either entry,
 * including for any future target type reused this way. Added entries
 * carry `treatments: []` (a `menus` row has no concept of child
 * treatments), so they render as plain links with no dropdown —
 * existing entries and their treatment dropdowns are untouched.
 */
export function mergeSecondaryMenusIntoSpecialities(
  specialities: NavSpecialityItem[],
  cmsSecondaryMenus: PublicMenuItem[]
): NavSpecialityItem[] {
  const existingHrefs = new Set(specialities.map((item) => item.href));

  const orphanItems: NavSpecialityItem[] = cmsSecondaryMenus
    .filter((menu): menu is PublicMenuItem & { href: string } => menu.href !== null && !existingHrefs.has(menu.href))
    .map((menu) => ({
      // Negative, never colliding with a real (positive) specialities.id
      // — these ids come from a different table (`menus`), not a second
      // specialities row.
      id: -menu.id,
      title: menu.label,
      shortDescription: null,
      href: menu.href,
      treatments: [],
    }));

  return [...specialities, ...orphanItems];
}

/**
 * A speciality that exists only as a global `menus` entry (merged in by
 * `mergeSecondaryMenusIntoSpecialities`, e.g. a global speciality with no
 * city speciality row) arrives with `treatments: []`. This fills in the
 * active global treatments of whichever global speciality its resolved
 * `href` points at — matched by the same `getGlobalContentUrl` href the
 * item already carries, never by name/id — so a new global treatment shows
 * up in its dropdown without any city treatment row. Items that already
 * have treatments, or whose href isn't a global speciality, are untouched.
 */
export async function attachGlobalTreatmentsToNavItems(items: NavSpecialityItem[]): Promise<NavSpecialityItem[]> {
  if (!items.some((item) => item.treatments.length === 0)) {
    return items;
  }

  try {
    const globalSpecialities = await prisma.global_specialities.findMany({
      where: { status: "active", global_treatments: { some: { status: "active" } } },
      select: {
        seo_url: true,
        global_treatments: {
          where: { status: "active" },
          select: { id: true, treatment_name: true, seo_url: true },
          orderBy: { treatment_name: "asc" },
        },
      },
    });

    const byHref = new Map(globalSpecialities.map((gs) => [getGlobalSpecialityUrl(gs.seo_url), gs]));

    return items.map((item) => {
      const match = item.treatments.length === 0 ? byHref.get(item.href) : undefined;
      if (!match) return item;
      return {
        ...item,
        treatments: match.global_treatments.map((g) => ({
          id: -g.id,
          name: g.treatment_name,
          href: getGlobalTreatmentUrl(g.seo_url),
        })),
      };
    });
  } catch (error) {
    console.error("[attachGlobalTreatmentsToNavItems] Database Query Error:", error);
    return items;
  }
}

export interface NavHospitalCityGroup {
  cityId: number;
  cityName: string;
  citySeoUrl: string;
  hospitals: {
    id: number;
    name: string;
    href: string;
  }[];
}

/**
 * Fetches clinical specialities and their child treatments for the active
 * city context. If `cityId`/`citySeoUrl` are null (nationwide routes, e.g.
 * the homepage with no city selected), links never fall back to any city
 * — each item instead links to its own explicitly-linked global content
 * page (`/dcg/{seoUrl}`, via `global_speciality_id`/`global_treatment_id`),
 * or to the nationwide listing page when no such link exists yet.
 */
export async function getPublicNavSpecialities(
  cityId: number | null,
  citySeoUrl: string | null
): Promise<NavSpecialityItem[]> {
  try {
    const rawSpecialities = await prisma.specialities.findMany({
      where: {
        status: "active",
        parent_speciality_id: null,
        ...(cityId !== null ? { city_id: cityId } : {}),
      },
      select: {
        id: true,
        speciality_name: true,
        speciality_title: true,
        short_description: true,
        seo_url: true,
        city_id: true,
        // Only ever consulted when no city is selected (see the href
        // logic below) — the explicit, admin-set link to this
        // speciality's city-independent global page, never a city row.
        global_specialities: {
          select: {
            seo_url: true,
            status: true,
            // The speciality's own active global treatments — the source of
            // truth for the no-city dropdown, so a newly created global
            // treatment appears here without needing a city treatment row.
            global_treatments: {
              where: { status: "active" },
              select: { id: true, treatment_name: true, seo_url: true },
              orderBy: { treatment_name: "asc" },
            },
          },
        },
        treatments: {
          where: {
            status: "active",
          },
          select: {
            id: true,
            sub_speciality_name: true,
            seo_url: true,
            city_id: true,
            global_treatment_id: true,
            global_treatments: {
              select: {
                seo_url: true,
                status: true,
                global_specialities: { select: { seo_url: true, status: true } },
              },
            },
          },
          orderBy: {
            sub_speciality_name: "asc",
          },
        },
      },
      orderBy: {
        speciality_name: "asc",
      },
    });

    return rawSpecialities.map((s) => {
      // No implicit/inferred city: when a city IS explicitly selected
      // (`citySeoUrl` set), every link stays city-scoped exactly as
      // before. When NO city is selected, a link must never fall back to
      // this row's own city (that was the bug — it silently leaked
      // Hyderabad on the nationwide homepage) — it goes to this
      // speciality's explicit, admin-linked global page instead, or to
      // the nationwide listing when no such link exists yet.
      let specialityHref: string;
      if (citySeoUrl) {
        specialityHref = getSpecialityUrl(citySeoUrl, s.seo_url);
      } else if (s.global_specialities && s.global_specialities.status === "active") {
        specialityHref = getGlobalSpecialityUrl(s.global_specialities.seo_url);
      } else {
        specialityHref = getSpecialitiesUrl();
      }

      // A treatment's own `city_id` is independent of its parent speciality's
      // in the schema, so `status: "active"` alone isn't enough — without
      // this, a treatment that drifted to a different city than its parent
      // speciality would still show up in that speciality's dropdown.
      const cityScopedTreatments = s.treatments.filter((t) => t.city_id === s.city_id);

      // No city selected: this speciality's active global treatments come
      // first, built straight from `global_treatments` (nested
      // `/dcg/{specialitySeoUrl}/{treatmentSeoUrl}`). A city treatment is
      // then only added when it isn't already represented — by its
      // explicit `global_treatment_id`, or by the same name — so existing
      // city-only treatments keep their prior links with no duplicates.
      const globalSpeciality = s.global_specialities;
      const globalTreatments =
        !citySeoUrl && globalSpeciality && globalSpeciality.status === "active" ? globalSpeciality.global_treatments : [];
      const globalIds = new Set(globalTreatments.map((g) => g.id));
      const globalNames = new Set(globalTreatments.map((g) => g.treatment_name.trim().toLowerCase()));

      const globalItems: NavTreatmentItem[] = globalTreatments.map((g) => ({
        // Negative, never colliding with a real (positive) treatments.id.
        id: -g.id,
        name: g.treatment_name,
        href: getGlobalTreatmentUrl(g.seo_url),
      }));

      const cityItems: NavTreatmentItem[] = cityScopedTreatments
        .filter(
          (t) =>
            !(t.global_treatment_id !== null && globalIds.has(t.global_treatment_id)) &&
            !globalNames.has(t.sub_speciality_name.trim().toLowerCase())
        )
        .map((t) => {
          let treatmentHref: string;
          if (citySeoUrl) {
            treatmentHref = getTreatmentUrl(citySeoUrl, t.seo_url);
          } else if (t.global_treatments && t.global_treatments.status === "active") {
            treatmentHref = getGlobalTreatmentUrl(t.global_treatments.seo_url);
          } else {
            treatmentHref = getTreatmentsUrl();
          }
          return { id: t.id, name: t.sub_speciality_name, href: treatmentHref };
        });

      return {
        id: s.id,
        title: s.speciality_title || s.speciality_name,
        shortDescription: s.short_description?.trim() || null,
        href: specialityHref,
        treatments: [...globalItems, ...cityItems].sort((a, b) => a.name.localeCompare(b.name)),
      };
    });
  } catch (error) {
    console.error("[getPublicNavSpecialities] Database Query Error:", error);
    return [];
  }
}

/**
 * Fetches active hospitals grouped by active cities for the multi-column mega menu.
 */
export async function getPublicHospitalsGroupedByCity(): Promise<NavHospitalCityGroup[]> {
  try {
    const rawCitiesWithHospitals = await prisma.cities.findMany({
      where: {
        status: "active",
        hospitals: {
          some: {
            status: "active",
          },
        },
      },
      select: {
        id: true,
        city_name: true,
        seo_url: true,
        hospitals: {
          where: {
            status: "active",
          },
          select: {
            id: true,
            hospital_name: true,
            seo_url: true,
          },
          orderBy: {
            hospital_name: "asc",
          },
        },
      },
      orderBy: {
        city_name: "asc",
      },
    });

    return rawCitiesWithHospitals.map((c) => ({
      cityId: c.id,
      cityName: c.city_name,
      citySeoUrl: c.seo_url,
      hospitals: c.hospitals.map((h) => ({
        id: h.id,
        name: h.hospital_name,
        href: getHospitalUrl(c.seo_url, h.seo_url),
      })),
    }));
  } catch (error) {
    console.error("[getPublicHospitalsGroupedByCity] Database Query Error:", error);
    return [];
  }
}