import { cache } from "react";
import { getDoctorBySeoUrl, getDoctorsPage } from "@/services/doctor.service";
import {
  getActiveDoctorHospitals,
  getActiveDoctorSpecialityMappings,
  getDoctorHospitals,
  getDoctorSpecialityMappings,
} from "@/services/doctor-mapping.service";
import { getDoctorSpecialities } from "@/services/doctor-speciality.service";
import { getDoctorAwards } from "@/services/doctor-award.service";
import { getDoctorFaqs } from "@/services/doctor-faq.service";
import { getPublicCities } from "@/lib/public/cities";
import { getDoctorUrl, getHospitalUrl } from "@/lib/public/urls";
import { toLocalImageUrl, toHospitalImageUrl } from "@/lib/public/homepage";
import { toEditorContent } from "@/lib/rich-text";
import type { HomepageDoctor } from "@/lib/public/homepage";

/**
 * Public data layer for Doctors — both the `/{citySeoUrl}/doctors/{seoUrl}`
 * Detail page and the nationwide `/doctors` Listing page. Same
 * "call the existing admin service, reshape into a public-safe DTO"
 * convention as every other `lib/public/*.ts` resolver.
 *
 * `PublicDoctorSpeciality` (the `doctor_specialities` nationwide taxonomy,
 * via `doctor_speciality_mappings`) is deliberately kept distinct from the
 * clinical `specialities` CMS entity used by Treatment/Speciality pages —
 * they are two different concepts that happen to share the word
 * "speciality" (see `getDoctorSpecialityUrl` in lib/public/urls.ts, which
 * already documents the same distinction for its own URL segment).
 */

// --- Doctor Detail (/{citySeoUrl}/doctors/{doctorSeoUrl}) -------------------

export type PublicDoctorSpeciality = {
  id: number;
  name: string;
};

export type PublicDoctorHospital = {
  id: number;
  name: string;
  href: string;
  imageUrl: string | null;
  address: string | null;
  cityName: string;
};

/** `doctor_awards` row — real, doctor-specific only. `organization`/`year`/`description` are each optional (per the CMS form), never invented when absent. */
export type PublicDoctorAward = {
  id: number;
  title: string;
  organization: string | null;
  year: string | null;
  description: string | null;
};

/** `doctor_faqs` row — real, doctor-specific only. `question`/`answer` are plain text, same as every other `*_faqs` table in this schema (no HTML support). */
export type PublicDoctorFaq = {
  id: number;
  question: string;
  answer: string;
};

export type PublicDoctorDetail = {
  id: number;
  name: string;
  seoUrl: string;
  citySeoUrl: string;
  cityId: number;
  cityName: string;
  imageUrl: string | null;
  qualification: string | null;
  experience: string | null;
  satisfactionScore: string | null;
  /** `doctors.doctor_description` — plain text, never fabricated. */
  about: string | null;
  /**
   * `doctors.doc_info` — rich HTML authored via the admin's RichTextEditor,
   * same `toEditorContent()` + `rte-content` + `dangerouslySetInnerHTML`
   * convention as every other admin-authored rich-text field on this site
   * (see `components/public/global/GlobalContent.tsx`). Deliberately a
   * SEPARATE field from `about` — this is the longer "Doctor Info" content
   * block, not a replacement for the short plain-text description.
   * Always a string (never null) so callers can check `.trim().length`
   * directly, same convention as `PublicGlobalContentDetail.descriptionHtml`.
   */
  docInfoHtml: string;
  /** `doctors.availability` — free-text general availability info, shown as-is. Never implies real-time booking/slot availability (no such system exists). */
  availability: string | null;
  /** `doctors.mon_sat_first_timings` — free-text, shown as-is. */
  monSatFirstTimings: string | null;
  /** `doctors.mon_sat_second_timings` — free-text, shown as-is. */
  monSatSecondTimings: string | null;
  /** `doctors.sunday_timings` — free-text, shown as-is. */
  sundayTimings: string | null;
  /** `doctors.time_interval` — free-text (e.g. "15 min"), shown as-is. */
  timeInterval: string | null;
  /**
   * `doctors.location_map` — an admin-entered map link, same convention as
   * `PublicHospitalDetail.locationMap` (hospitals' own field — these are
   * NOT the same column, each entity has its own, never shared/duplicated).
   */
  locationMap: string | null;
  /** `doctors.latitude`/`doctors.longitude` — real stored coordinates, converted to string the same way `satisfactionScore` is. Never fabricated when absent. */
  latitude: string | null;
  longitude: string | null;
  /** `doctors.location_id` → `locations.area` — the doctor's own assigned location/area, if any (distinct from `cityName`, which is always present). */
  locationArea: string | null;
  specialities: PublicDoctorSpeciality[];
  hospitals: PublicDoctorHospital[];
  awards: PublicDoctorAward[];
  faqs: PublicDoctorFaq[];
  metaTitle: string | null;
  metaDescription: string | null;
};

export type DoctorLookupResult =
  | { status: "not-found" }
  | { status: "wrong-city"; canonicalCitySeoUrl: string; canonicalSeoUrl: string }
  | { status: "ok"; detail: PublicDoctorDetail };

/** Idempotent — safe whether the admin already typed the "Dr." prefix into `doctor_name` or not (confirmed in real data: both forms occur). */
export function doctorDisplayNameWithTitle(name: string): string {
  return /^dr\.?\s/i.test(name.trim()) ? name.trim() : `Dr. ${name.trim()}`;
}

/**
 * Full resolve for a Doctor Detail page. `getDoctorBySeoUrl` is
 * active-only, so a miss is unambiguously "not found." A hit whose real
 * city doesn't match the URL's city segment redirects to the doctor's
 * canonical city URL instead of silently rendering under the wrong city —
 * same precedent as every other city-prefixed detail resolver.
 */
export async function resolvePublicDoctor(citySeoUrl: string, doctorSeoUrl: string): Promise<DoctorLookupResult> {
  const doctor = await getDoctorBySeoUrl(doctorSeoUrl);

  if (!doctor) {
    return { status: "not-found" };
  }

  if (doctor.city.seo_url !== citySeoUrl) {
    return { status: "wrong-city", canonicalCitySeoUrl: doctor.city.seo_url, canonicalSeoUrl: doctor.seo_url };
  }

  const [hospitals, specialities, awardRows, faqRows] = await Promise.all([
    getActiveDoctorHospitals(doctor.id),
    getActiveDoctorSpecialityMappings(doctor.id),
    getDoctorAwards({ doctor_id: doctor.id }),
    getDoctorFaqs({ doctor_id: doctor.id }),
  ]);

  // `getDoctorAwards`/`getDoctorFaqs` have no `status` filter param (same
  // gap `getHospitalFaqs` has — see lib/public/blogs.ts's own identical
  // comment) — filtered here instead, so only active, doctor-specific
  // records ever reach the public page.
  const awards: PublicDoctorAward[] = awardRows
    .filter((award) => award.status === "active")
    .map((award) => ({
      id: award.id,
      title: award.title,
      organization: award.organization?.trim() || null,
      year: award.award_year?.trim() || null,
      description: award.description?.trim() || null,
    }));

  const faqs: PublicDoctorFaq[] = faqRows
    .filter((faq) => faq.status === "active")
    .map((faq) => ({ id: faq.id, question: faq.title, answer: faq.text }));

  const detail: PublicDoctorDetail = {
    id: doctor.id,
    name: doctor.doctor_name,
    seoUrl: doctor.seo_url,
    citySeoUrl: doctor.city.seo_url,
    cityId: doctor.city.id,
    cityName: doctor.city.city_name,
    imageUrl: toLocalImageUrl(doctor.doctor_image),
    qualification: doctor.qualification,
    experience: doctor.experience,
    satisfactionScore: doctor.patient_satisfaction_score != null ? doctor.patient_satisfaction_score.toString() : null,
    about: doctor.doctor_description?.trim() || null,
    docInfoHtml: toEditorContent(doctor.doc_info),
    availability: doctor.availability?.trim() || null,
    monSatFirstTimings: doctor.mon_sat_first_timings?.trim() || null,
    monSatSecondTimings: doctor.mon_sat_second_timings?.trim() || null,
    sundayTimings: doctor.sunday_timings?.trim() || null,
    timeInterval: doctor.time_interval?.trim() || null,
    locationMap: doctor.location_map?.trim() || null,
    latitude: doctor.latitude != null ? doctor.latitude.toString() : null,
    longitude: doctor.longitude != null ? doctor.longitude.toString() : null,
    locationArea: doctor.location?.area?.trim() || null,
    specialities: specialities.map((speciality) => ({ id: speciality.id, name: speciality.speciality_name })),
    hospitals: hospitals.map((hospital) => ({
      id: hospital.id,
      name: hospital.hospital_name,
      href: getHospitalUrl(hospital.cities.seo_url, hospital.seo_url),
      imageUrl: toHospitalImageUrl(hospital.hospital_image),
      address: hospital.address?.trim() || null,
      cityName: hospital.cities.city_name,
    })),
    awards,
    faqs,
    metaTitle: doctor.meta_title?.trim() || null,
    metaDescription: doctor.meta_description?.trim() || null,
  };

  return { status: "ok", detail };
}

export const getCachedPublicDoctor = cache((citySeoUrl: string, doctorSeoUrl: string) =>
  resolvePublicDoctor(citySeoUrl, doctorSeoUrl)
);

// --- Doctor Listing (/doctors) -----------------------------------------------

const DOCTOR_LISTING_PAGE_SIZE = 12;

export type PublicDoctorListingFilter = {
  /** Matches anywhere in `doctor_name`, case-insensitivity depends on the DB collation (same convention as every other `contains` text filter in this codebase). */
  search?: string;
  /** Optional narrowing — omitted (not `null`) means "every city," the listing's actual default scope. Never applied implicitly from header/city context; only ever set by the admin's own explicit filter selection. */
  cityId?: number;
  doctorSpecialityId?: number;
};

export type PublicDoctorListing = {
  items: HomepageDoctor[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type PublicDoctorListingFilterOptions = {
  cities: { id: number; name: string }[];
  specialities: { id: number; name: string }[];
};

/** The filter dropdowns' own option lists — active cities and active doctor_specialities, nationwide (not scoped to whatever's currently filtered), so switching one filter never prunes the other's choices out from under the admin. */
export async function getPublicDoctorListingFilterOptions(): Promise<PublicDoctorListingFilterOptions> {
  const [cities, specialities] = await Promise.all([
    getPublicCities(),
    getDoctorSpecialities({ status: "active" }),
  ]);

  return {
    cities: cities.map((city) => ({ id: city.id, name: city.name })),
    specialities: specialities.map((speciality) => ({ id: speciality.id, name: speciality.speciality_name })),
  };
}

/**
 * Nationwide, paginated, active-only doctor listing for `/doctors` — the
 * GLOBAL directory. `filter.cityId`/`filter.doctorSpecialityId` are
 * optional narrowing the admin explicitly chose via the page's own filter
 * controls; with none set, every active doctor nationwide is returned,
 * exactly as before. Never implicitly scoped to the header's selected
 * city or any other ambient city context. Reuses the same
 * first-mapped-hospital/speciality-per-card shape `getHomepageDoctors`
 * already established, driven by the paginated query instead of the
 * capped homepage one — plus `cityName` on every card, since a global,
 * multi-city directory needs to show which city each doctor is in (the
 * homepage's own per-city carousel never needs this and still doesn't
 * get it — see HomepageDoctor's own doc comment).
 */
export async function resolvePublicDoctorListing(
  page: number,
  filter: PublicDoctorListingFilter = {}
): Promise<PublicDoctorListing> {
  const { items: doctors, total } = await getDoctorsPage({
    page,
    pageSize: DOCTOR_LISTING_PAGE_SIZE,
    search: filter.search,
    city_id: filter.cityId,
    doctor_speciality_id: filter.doctorSpecialityId,
  });

  const [hospitalsByDoctor, specialitiesByDoctor] = await Promise.all([
    Promise.all(doctors.map((doctor) => getDoctorHospitals(doctor.id))),
    Promise.all(doctors.map((doctor) => getDoctorSpecialityMappings(doctor.id))),
  ]);

  const items: HomepageDoctor[] = doctors.map((doctor, index) => ({
    id: doctor.id,
    name: doctor.doctor_name,
    qualification: doctor.qualification,
    experience: doctor.experience,
    satisfactionScore: doctor.patient_satisfaction_score != null ? doctor.patient_satisfaction_score.toString() : null,
    imageUrl: toLocalImageUrl(doctor.doctor_image),
    href: getDoctorUrl(doctor.city.seo_url, doctor.seo_url),
    specialityName: specialitiesByDoctor[index][0]?.speciality_name ?? null,
    hospitalName: hospitalsByDoctor[index][0]?.hospital_name ?? null,
    cityName: doctor.city.city_name,
  }));

  return {
    items,
    page,
    pageSize: DOCTOR_LISTING_PAGE_SIZE,
    totalCount: total,
    totalPages: Math.max(1, Math.ceil(total / DOCTOR_LISTING_PAGE_SIZE)),
  };
}

export const getCachedPublicDoctorListing = cache(
  (page: number, search: string, cityId: number | undefined, doctorSpecialityId: number | undefined) =>
    resolvePublicDoctorListing(page, { search: search || undefined, cityId, doctorSpecialityId })
);
