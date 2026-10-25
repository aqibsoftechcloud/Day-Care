import { cache } from "react";
import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getCityBySeoUrl } from "@/services/city.service";
import {
  getDoctorUrl,
  getGlobalSpecialityUrl,
  getGlobalTreatmentUrl,
  getHospitalUrl,
  getSpecialityUrl,
  getTreatmentUrl,
} from "@/lib/public/urls";

/**
 * Public site search. One server utility shared by the header dropdown
 * (`GET /api/search`) and the `/search` results page, so the two can never
 * disagree. It queries only public, active records and selects only public
 * fields (names, slugs, city, speciality/hospital labels) — never contact
 * details, descriptions or CMS drafts — and builds every link with the
 * existing URL helpers.
 *
 * Global vs city: with NO city ("All Cities"), global treatments/specialities
 * (`/dcg/...`) are returned, plus any city-only record that has no global
 * counterpart (linked to its own city page and labelled with that city);
 * doctors/hospitals come from every city. With a city, that city's own
 * records are used, and global ones STAY available — except those the city
 * already has a linked/same-named record for, so nothing shows twice.
 * "All Cities" is simply the absence of a city, never a city.
 */

export type SearchEntityType = "doctor" | "treatment" | "speciality" | "hospital";

export type SearchResultItem = {
  /** Unique across types, e.g. `doctor:12`. */
  key: string;
  type: SearchEntityType;
  title: string;
  /** Short context line: speciality, hospital, city… (only real data). */
  subtitle: string | null;
  href: string;
};

export type SearchGroups = Record<"doctors" | "treatments" | "specialities" | "hospitals", SearchResultItem[]>;

export type SearchResponse = {
  query: string;
  city: { id: number; name: string; seoUrl: string } | null;
  groups: SearchGroups;
  total: number;
};

export const MIN_SEARCH_LENGTH = 2;
export const MAX_SEARCH_LENGTH = 80;
/** Rows read per entity before ranking — keeps each query cheap regardless of the final display limit. */
const FETCH_LIMIT = 30;

/** Trim, collapse whitespace, cap length. */
export function normalizeSearchQuery(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_SEARCH_LENGTH);
}

const normalize = (value: string) => value.toLowerCase().replace(/[.,]/g, " ").replace(/\s+/g, " ").trim();

/**
 * Ranking: exact name > name prefix > a word in the name starts with the
 * query > query inside the name > all words present > matched only through a
 * secondary field (speciality, hospital, city, qualification…).
 */
function rank(query: string, primary: string, secondary: (string | null | undefined)[] = []): number {
  const q = normalize(query);
  const name = normalize(primary);
  if (name === q) return 100;
  if (name.startsWith(q)) return 80;
  if (name.split(" ").some((word) => word.startsWith(q))) return 65;
  if (name.includes(q)) return 45;
  const tokens = q.split(" ");
  if (tokens.every((token) => name.includes(token))) return 35;
  if (secondary.some((value) => value && normalize(value).includes(q))) return 20;
  return 10;
}

/** Each whitespace-separated word must match at least one of the entity's fields — so "dr arjun" finds "Dr. Arjun Reddy". `contains` is case-insensitive under the project's utf8mb4_unicode_ci collation and Prisma escapes LIKE wildcards. */
function everyToken<T>(tokens: string[], fieldMatchers: (token: string) => T[]): { AND: { OR: T[] }[] } {
  return { AND: tokens.map((token) => ({ OR: fieldMatchers(token) })) };
}

function pickTop(items: (SearchResultItem & { score: number })[], limit: number): SearchResultItem[] {
  const seen = new Set<string>();
  return items
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .filter((item) => (seen.has(item.key) ? false : (seen.add(item.key), true)))
    .slice(0, limit)
    .map(({ score, ...item }) => {
      void score;
      return item;
    });
}

export async function searchPublicContent(options: { query: string; citySeoUrl?: string | null; limit?: number }): Promise<SearchResponse> {
  const query = normalizeSearchQuery(options.query);
  const limit = Math.min(Math.max(options.limit ?? 5, 1), 25);
  const cityRow = options.citySeoUrl ? await getCityBySeoUrl(options.citySeoUrl) : null;
  const city = cityRow ? { id: cityRow.id, name: cityRow.city_name, seoUrl: cityRow.seo_url } : null;

  const empty: SearchResponse = { query, city, groups: { doctors: [], treatments: [], specialities: [], hospitals: [] }, total: 0 };
  if (query.length < MIN_SEARCH_LENGTH) return empty;

  const tokens = normalize(query).split(" ").filter(Boolean);
  const cityFilter = city ? { city_id: city.id } : {};

  const [doctorRows, hospitalRows, globalTreatmentRows, globalSpecialityRows, cityTreatmentRows, citySpecialityRows] = await Promise.all([
    prisma.doctors.findMany({
      where: {
        status: "active",
        cities: { status: "active" },
        ...cityFilter,
        ...everyToken<Prisma.doctorsWhereInput>(tokens, (t) => [
          { doctor_name: { contains: t } },
          { qualification: { contains: t } },
          { doctor_speciality_mappings: { some: { doctor_specialities: { speciality_name: { contains: t } } } } },
          { doctor_hospitals: { some: { hospitals: { hospital_name: { contains: t } } } } },
        ]),
      },
      select: {
        id: true,
        doctor_name: true,
        seo_url: true,
        qualification: true,
        cities: { select: { seo_url: true, city_name: true } },
        doctor_speciality_mappings: { select: { doctor_specialities: { select: { speciality_name: true } } } },
        doctor_hospitals: { select: { hospitals: { select: { hospital_name: true, status: true } } } },
      },
      orderBy: { doctor_name: "asc" },
      take: FETCH_LIMIT,
    }),
    prisma.hospitals.findMany({
      where: {
        status: "active",
        cities: { status: "active" },
        ...cityFilter,
        ...everyToken<Prisma.hospitalsWhereInput>(tokens, (t) => [
          { hospital_name: { contains: t } },
          { address: { contains: t } },
          { cities: { city_name: { contains: t } } },
          { locations: { area: { contains: t } } },
        ]),
      },
      select: { id: true, hospital_name: true, seo_url: true, address: true, cities: { select: { seo_url: true, city_name: true } } },
      orderBy: { hospital_name: "asc" },
      take: FETCH_LIMIT,
    }),
    prisma.global_treatments.findMany({
      where: {
        status: "active",
        ...everyToken<Prisma.global_treatmentsWhereInput>(tokens, (t) => [{ treatment_name: { contains: t } }, { treatment_title: { contains: t } }]),
      },
      select: { id: true, treatment_name: true, treatment_title: true, seo_url: true, global_specialities: { select: { speciality_name: true, speciality_title: true, status: true } } },
      orderBy: { treatment_name: "asc" },
      take: FETCH_LIMIT,
    }),
    prisma.global_specialities.findMany({
      where: {
        status: "active",
        ...everyToken<Prisma.global_specialitiesWhereInput>(tokens, (t) => [{ speciality_name: { contains: t } }, { speciality_title: { contains: t } }]),
      },
      select: { id: true, speciality_name: true, speciality_title: true, seo_url: true },
      orderBy: { speciality_name: "asc" },
      take: FETCH_LIMIT,
    }),
    prisma.treatments.findMany({
      where: {
        status: "active",
        cities: { status: "active" },
        ...cityFilter,
        ...everyToken<Prisma.treatmentsWhereInput>(tokens, (t) => [{ sub_speciality_name: { contains: t } }, { sub_speciality_title: { contains: t } }]),
      },
      select: {
        id: true,
        sub_speciality_name: true,
        sub_speciality_title: true,
        seo_url: true,
        global_treatment_id: true,
        cities: { select: { seo_url: true, city_name: true } },
        specialities: { select: { speciality_name: true, speciality_title: true } },
      },
      orderBy: { sub_speciality_name: "asc" },
      take: FETCH_LIMIT,
    }),
    prisma.specialities.findMany({
      where: {
        status: "active",
        cities: { status: "active" },
        ...cityFilter,
        ...everyToken<Prisma.specialitiesWhereInput>(tokens, (t) => [{ speciality_name: { contains: t } }, { speciality_title: { contains: t } }]),
      },
      select: { id: true, speciality_name: true, speciality_title: true, seo_url: true, global_speciality_id: true, cities: { select: { seo_url: true, city_name: true } } },
      orderBy: { speciality_name: "asc" },
      take: FETCH_LIMIT,
    }),
  ]);

  // --- doctors ---
  const doctors = pickTop(
    doctorRows.map((doctor) => {
      const specialities = doctor.doctor_speciality_mappings.map((m) => m.doctor_specialities.speciality_name);
      const hospitals = doctor.doctor_hospitals.filter((h) => h.hospitals.status === "active").map((h) => h.hospitals.hospital_name);
      return {
        key: `doctor:${doctor.id}`,
        type: "doctor" as const,
        title: doctor.doctor_name,
        subtitle: [specialities[0], doctor.cities.city_name].filter(Boolean).join(" · ") || null,
        href: getDoctorUrl(doctor.cities.seo_url, doctor.seo_url),
        score: rank(query, doctor.doctor_name, [doctor.qualification, ...specialities, ...hospitals]),
      };
    }),
    limit
  );

  // --- hospitals ---
  const hospitals = pickTop(
    hospitalRows.map((hospital) => ({
      key: `hospital:${hospital.id}`,
      type: "hospital" as const,
      title: hospital.hospital_name,
      subtitle: hospital.cities.city_name,
      href: getHospitalUrl(hospital.cities.seo_url, hospital.seo_url),
      score: rank(query, hospital.hospital_name, [hospital.cities.city_name, hospital.address]),
    })),
    limit
  );

  // --- treatments ---
  // City selected: that city's records cover (hide) the global ones they're linked to / share a name with.
  // All Cities: global records, plus city-only records with no global counterpart (labelled with their city).
  const globalTreatmentName = (t: (typeof globalTreatmentRows)[number]) => normalize(t.treatment_title?.trim() || t.treatment_name);
  const cityRowName = (t: (typeof cityTreatmentRows)[number]) => t.sub_speciality_title?.trim() || t.sub_speciality_name;
  const globalTreatmentNames = new Set(globalTreatmentRows.map(globalTreatmentName));
  const visibleCityTreatments = city
    ? cityTreatmentRows
    : cityTreatmentRows.filter((t) => t.global_treatment_id === null && !globalTreatmentNames.has(normalize(cityRowName(t))));
  const coveredGlobalTreatmentIds = new Set(city ? cityTreatmentRows.map((t) => t.global_treatment_id).filter((id): id is number => id !== null) : []);
  const coveredTreatmentNames = new Set(city ? cityTreatmentRows.map((t) => normalize(cityRowName(t))) : []);
  const treatments = pickTop(
    [
      ...visibleCityTreatments.map((treatment) => {
        const name = cityRowName(treatment);
        const parent = treatment.specialities?.speciality_title?.trim() || treatment.specialities?.speciality_name || null;
        return {
          key: `treatment:city:${treatment.id}`,
          type: "treatment" as const,
          title: name,
          subtitle: [parent, treatment.cities.city_name].filter(Boolean).join(" · ") || null,
          href: getTreatmentUrl(treatment.cities.seo_url, treatment.seo_url),
          score: rank(query, name, [parent]) + (city ? 1 : 0), // with a city selected, its own record wins ties over the global one
        };
      }),
      ...globalTreatmentRows
        .filter((treatment) => !coveredGlobalTreatmentIds.has(treatment.id) && !coveredTreatmentNames.has(globalTreatmentName(treatment)))
        .map((treatment) => {
          const name = treatment.treatment_title?.trim() || treatment.treatment_name;
          const parentRow = treatment.global_specialities && treatment.global_specialities.status === "active" ? treatment.global_specialities : null;
          const parent = parentRow ? parentRow.speciality_title?.trim() || parentRow.speciality_name : null;
          return {
            key: `treatment:global:${treatment.id}`,
            type: "treatment" as const,
            title: name,
            subtitle: parent,
            href: getGlobalTreatmentUrl(treatment.seo_url),
            score: rank(query, name, [parent]),
          };
        }),
    ],
    limit
  );

  // --- specialities: same rule ---
  const globalSpecialityName = (g: (typeof globalSpecialityRows)[number]) => normalize(g.speciality_title?.trim() || g.speciality_name);
  const citySpecialityName = (c: (typeof citySpecialityRows)[number]) => c.speciality_title?.trim() || c.speciality_name;
  const globalSpecialityNames = new Set(globalSpecialityRows.map(globalSpecialityName));
  const visibleCitySpecialities = city
    ? citySpecialityRows
    : citySpecialityRows.filter((c) => c.global_speciality_id === null && !globalSpecialityNames.has(normalize(citySpecialityName(c))));
  const coveredGlobalSpecialityIds = new Set(city ? citySpecialityRows.map((c) => c.global_speciality_id).filter((id): id is number => id !== null) : []);
  const coveredSpecialityNames = new Set(city ? citySpecialityRows.map((c) => normalize(citySpecialityName(c))) : []);
  const specialities = pickTop(
    [
      ...visibleCitySpecialities.map((speciality) => {
        const name = citySpecialityName(speciality);
        return {
          key: `speciality:city:${speciality.id}`,
          type: "speciality" as const,
          title: name,
          subtitle: speciality.cities.city_name,
          href: getSpecialityUrl(speciality.cities.seo_url, speciality.seo_url),
          score: rank(query, name) + (city ? 1 : 0),
        };
      }),
      ...globalSpecialityRows
        .filter((speciality) => !coveredGlobalSpecialityIds.has(speciality.id) && !coveredSpecialityNames.has(globalSpecialityName(speciality)))
        .map((speciality) => {
          const name = speciality.speciality_title?.trim() || speciality.speciality_name;
          return {
            key: `speciality:global:${speciality.id}`,
            type: "speciality" as const,
            title: name,
            subtitle: null,
            href: getGlobalSpecialityUrl(speciality.seo_url),
            score: rank(query, name),
          };
        }),
    ],
    limit
  );

  return { query, city, groups: { doctors, treatments, specialities, hospitals }, total: doctors.length + treatments.length + specialities.length + hospitals.length };
}

/** Per-request memoised variant for the `/search` results page (metadata + body share one lookup). */
export const getCachedSearchResults = cache((query: string, citySeoUrl: string | null, limit: number) =>
  searchPublicContent({ query, citySeoUrl, limit })
);
