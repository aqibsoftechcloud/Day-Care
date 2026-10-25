/**
 * Centralized public-site URL builders for the locked public URL
 * architecture. Every public page/component should build a link through
 * one of these instead of hand-interpolating a path string, so the route
 * shapes live in exactly one place.
 *
 * All helpers return a relative path beginning with "/". Dynamic segments
 * are individually `encodeURIComponent`-ed — `seo_url` values are expected
 * to already be URL-safe by convention, but encoding here is cheap
 * insurance against anything unexpected (spaces, non-ASCII characters)
 * reaching a link.
 */

function segment(value: string): string {
  return encodeURIComponent(value);
}

// --- City ---

export function getCitiesUrl(): string {
  return "/cities";
}

export function getCityUrl(citySeoUrl: string): string {
  return `/${segment(citySeoUrl)}`;
}

// --- Specialities (city-scoped canonical detail; nationwide listing) ---

export function getSpecialitiesUrl(): string {
  return "/specialities";
}

/** `/{citySeoUrl}/specialities` — that city's own speciality listing (the nationwide one is `getSpecialitiesUrl()`). */
export function getCitySpecialitiesUrl(citySeoUrl: string): string {
  return `/${segment(citySeoUrl)}/specialities`;
}

export function getSpecialityUrl(citySeoUrl: string, specialitySeoUrl: string): string {
  return `/${segment(citySeoUrl)}/specialities/${segment(specialitySeoUrl)}`;
}

// --- Global/Common content (city-independent — NOT a city-scoped detail) ---

/**
 * `/dcg/speciality/{seoUrl}` — a Global Speciality ("Daycare Global"). Both
 * global tables keep their `seo_url` unique (a DB unique index each, plus a
 * write-time cross-table check), and the entity type is part of the path, so
 * a slug never needs to be looked up in "the other" table. Old forms
 * (`/dcg/{seoUrl}`, and the earlier `/c/{seoUrl}`) permanently redirect
 * here — see `app/(public)/dcg/[seoUrl]/page.tsx` and next.config.ts.
 */
export function getGlobalSpecialityUrl(seoUrl: string): string {
  return `/dcg/speciality/${segment(seoUrl)}`;
}

/**
 * `/dcg/treatment/{seoUrl}` — a Global Treatment, resolved by its own slug
 * alone. A treatment's optional parent speciality no longer affects its URL
 * (it is still used for the breadcrumb and Related Treatments); the old
 * nested `/dcg/{speciality}/{treatment}` form permanently redirects here.
 */
export function getGlobalTreatmentUrl(seoUrl: string): string {
  return `/dcg/treatment/${segment(seoUrl)}`;
}

// --- Treatments ---

export function getTreatmentsUrl(): string {
  return "/treatments";
}

/** `/{citySeoUrl}/treatments` — that city's own treatment listing (the nationwide one is `getTreatmentsUrl()`). */
export function getCityTreatmentsUrl(citySeoUrl: string): string {
  return `/${segment(citySeoUrl)}/treatments`;
}

export function getTreatmentUrl(citySeoUrl: string, treatmentSeoUrl: string): string {
  return `/${segment(citySeoUrl)}/treatments/${segment(treatmentSeoUrl)}`;
}

// --- Hospitals (city-scoped listing, same nesting as the detail route) ---

export function getHospitalsUrl(citySeoUrl: string): string {
  return `/${segment(citySeoUrl)}/hospitals`;
}

/** `/hospitals` — the nationwide, city-independent listing. Deliberately a distinct name from `getHospitalsUrl(citySeoUrl)` above (the per-city listing) rather than an overload, since the two return genuinely different routes. */
export function getHospitalsNationwideUrl(): string {
  return "/hospitals";
}

export function getHospitalUrl(citySeoUrl: string, hospitalSeoUrl: string): string {
  return `/${segment(citySeoUrl)}/hospitals/${segment(hospitalSeoUrl)}`;
}

// --- Doctors (individual profile) ---

export function getDoctorsUrl(): string {
  return "/doctors";
}

export function getDoctorUrl(citySeoUrl: string, doctorSeoUrl: string): string {
  return `/${segment(citySeoUrl)}/doctors/${segment(doctorSeoUrl)}`;
}

/** The doctor_specialities taxonomy facet — distinct from the clinical `specialities` entity, so it lives under its own `/doctors/speciality/` segment rather than `/specialities/{seoUrl}`. */
export function getDoctorSpecialityUrl(doctorSpecialitySeoUrl: string): string {
  return `/doctors/speciality/${segment(doctorSpecialitySeoUrl)}`;
}

// --- Doctor Pages (city x speciality x optional-location landing pages — NOT a doctor profile) ---

export function getFindADoctorUrl(): string {
  return "/find-a-doctor";
}

export function getDoctorPageUrl(citySeoUrl: string, doctorPageSeoUrl: string): string {
  return `/${segment(citySeoUrl)}/find-a-doctor/${segment(doctorPageSeoUrl)}`;
}

// --- Blogs ---

export function getBlogsUrl(): string {
  return "/blogs";
}

export function getBlogCategoryUrl(blogCategorySeoUrl: string): string {
  return `/blogs/category/${segment(blogCategorySeoUrl)}`;
}

export function getBlogUrl(blogSeoUrl: string): string {
  return `/blogs/${segment(blogSeoUrl)}`;
}

// --- Conditions (symptom parts / symptom articles) ---

export function getConditionsUrl(): string {
  return "/conditions";
}

export function getConditionPartUrl(partSeoUrl: string): string {
  return `/conditions/${segment(partSeoUrl)}`;
}

export function getSymptomArticleUrl(partSeoUrl: string, articleSeoUrl: string): string {
  return `/conditions/${segment(partSeoUrl)}/${segment(articleSeoUrl)}`;
}

// --- Health Packages ---

export function getHealthPackagesUrl(): string {
  return "/health-packages";
}

export function getHealthPackageUrl(healthPackageSeoUrl: string): string {
  return `/health-packages/${segment(healthPackageSeoUrl)}`;
}

// --- Other public content (listings only — none of these have a locked detail URL yet) ---

export function getTestimonialsUrl(): string {
  return "/testimonials";
}

export function getGalleryUrl(): string {
  return "/gallery";
}

export function getNewsMediaUrl(): string {
  return "/news-media";
}

export function getEventsUrl(): string {
  return "/events";
}

export function getFaqsUrl(): string {
  return "/faqs";
}

export function getOvulationCalculatorUrl(): string {
  return "/tools/ovulation-calculator";
}

// --- Generic CMS Pages — intentionally flat, never city-prefixed ---

export function getGenericPageUrl(pageSeoUrl: string): string {
  return `/${segment(pageSeoUrl)}`;
}

// --- Contact Us (global, city-independent; the destination of every appointment CTA) ---

export type ContactUsContext = {
  /** Active `cities.id` to preselect. Validated against the real city options on the page. */
  cityId?: number | null;
  /** A consultation-form treatment option value: `city:{treatments.id}` or `global:{global_treatments.id}`. */
  treatment?: string | null;
};

/**
 * `/contact-us` — the one page every appointment CTA points at. The
 * optional context becomes `?city=` / `?treatment=`, which the page
 * re-validates against the real dropdown options (an unknown value is
 * simply ignored), so a link can never preselect something invalid.
 */
export function getContactUsUrl(context: ContactUsContext = {}): string {
  const params = new URLSearchParams();
  if (context.cityId != null && Number.isInteger(context.cityId) && context.cityId > 0) params.set("city", String(context.cityId));
  if (context.treatment && /^(city|global):\d{1,10}$/.test(context.treatment)) params.set("treatment", context.treatment);
  const query = params.toString();
  return query ? `/contact-us?${query}` : "/contact-us";
}

// --- Search ---

/** `/search?q=…&city=…` — the full results page. `city` (a city `seo_url`) is omitted for "All Cities". */
export function getSearchUrl(query: string, citySeoUrl?: string | null): string {
  const params = new URLSearchParams({ q: query });
  if (citySeoUrl) params.set("city", citySeoUrl);
  return `/search?${params.toString()}`;
}
