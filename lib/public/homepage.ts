import { getHeroBanner } from "@/lib/public/banners";
import type { PublicHeroBanner } from "@/lib/public/banners";
import { getSpecialities } from "@/services/speciality.service";
import { getTreatments } from "@/services/treatment.service";
import { getDoctors } from "@/services/doctor.service";
import { getDoctorHospitals, getDoctorSpecialityMappings } from "@/services/doctor-mapping.service";
import { getTestimonials } from "@/services/testimonial.service";
import { getBlogs } from "@/services/blog.service";
import { getLocations } from "@/services/location.service";
import { getHospitals } from "@/services/hospital.service";
import { getGeneralFaqs } from "@/services/general-faq.service";
// Global Specialities/Treatments — imported from the service layer
// (never from lib/public/specialities.ts or lib/public/treatments.ts,
// which both already import FROM this file for toLocalImageUrl/
// toHospitalImageUrl; importing back would be a circular dependency).
// These are the exact same service functions /specialities, /treatments,
// and /dcg/{seoUrl} already use — see those modules' own
// resolvePublicSpecialityListing/resolvePublicTreatmentListing.
import { getGlobalSpecialitiesPage } from "@/services/global-speciality.service";
import { getGlobalTreatmentsPage } from "@/services/global-treatment.service";
import {
  getBlogUrl,
  getDoctorUrl,
  getGlobalSpecialityUrl,
  getGlobalTreatmentUrl,
  getHospitalUrl,
  getSpecialityUrl,
  getTreatmentUrl,
} from "@/lib/public/urls";

/**
 * Homepage-only data layer — every function here calls an existing
 * admin service (never Prisma directly, never a new API route) and
 * reshapes the result into a small, public-safe DTO with only the
 * fields the homepage actually renders. No fabricated/fallback content
 * is ever produced here: an empty CMS dataset simply yields an empty
 * array or `null`, and the calling Server Component decides whether to
 * hide that section.
 *
 * Every section function takes `cityId: number | null` — the same
 * value the route already resolved (the global `/` homepage passes
 * `null`, the `/{city}` homepage passes that city's real id; see
 * `components/public/home/HomePage.tsx`). `null` means "no city
 * context," which filters nothing (the pre-existing, nationwide-mixed
 * behavior `/` has always had) — it is never treated as "pick a
 * default city." Passing a real id filters that section to that city
 * alone; a city with no matching rows simply gets an empty section,
 * never another city's content.
 */

/** Cap applied to list-style homepage sections — keeps the homepage lean regardless of how much CMS content eventually exists; the full dataset is always available on its own listing page. */
const HOMEPAGE_LIST_LIMIT = 8;
/** Blogs specifically cap at 2 full grid rows (3 cols on desktop) rather than the shared 8 — bumped from the original placeholder of 3 (which would have made the grid-vs-carousel choice below moot) once this section actually needed a real number to decide against. */
const HOMEPAGE_BLOG_LIMIT = 6;
/** FAQs cap at 8 — a clean 4-row-by-2-column desktop layout, within the requested "approximately 6-8" range. */
const HOMEPAGE_FAQ_LIMIT = 8;
/** Specialized Care grid cap — 11, not the shared `HOMEPAGE_LIST_LIMIT`: the grid is a fixed 6-column/2-row desktop composition with a dedicated "View All" card occupying the 12th slot, so 11 real items is the most that composition can show without either starving a row or forcing the CTA card onto a third row. */
const SPECIALIZED_CARE_GRID_LIMIT = 11;

// --- Hero / Banner -------------------------------------------------------

export type HomepageBanner = PublicHeroBanner;

/**
 * Delegates to `lib/public/banners.ts` — the one canonical Hero/Banner
 * selection query (status + city match, `sorting_order` asc / `id` desc
 * tie-break) — instead of keeping a second, divergent copy of that logic
 * here.
 */
export const getHomepageBanner = getHeroBanner;

// --- Trust / Statistics strip ------------------------------------------------

export type HomepageTrustStats = {
  specialitiesCount: number;
  treatmentsCount: number;
  doctorsCount: number;
  hospitalsCount: number;
};

/**
 * Real counts only, reusing the exact same `getSpecialities`/
 * `getTreatments`/`getDoctors`/`getHospitals` service calls every other
 * homepage section already makes (no new resolver/count-query layer).
 * There is no "patients"/"consultations" column or aggregate anywhere in
 * this schema, so that metric is deliberately omitted rather than
 * invented. Hospitals are intentionally NOT restricted to `[]` when
 * `cityId` is `null` the way `getHomepageHospitals` is — a nationwide
 * *total* is meaningful for a stats strip even though a nationwide
 * "Hospitals in your city" *listing* isn't.
 */
export async function getHomepageTrustStats(cityId: number | null): Promise<HomepageTrustStats> {
  const cityFilter = cityId !== null ? { city_id: cityId } : {};

  const [specialityRows, treatmentRows, doctorRows, hospitalRows] = await Promise.all([
    getSpecialities({ status: "active", ...cityFilter }),
    getTreatments({ status: "active", ...cityFilter }),
    getDoctors({ status: "active", ...cityFilter }),
    getHospitals({ status: "active", ...cityFilter }),
  ]);

  return {
    specialitiesCount: specialityRows.length,
    treatmentsCount: treatmentRows.length,
    doctorsCount: doctorRows.length,
    hospitalsCount: hospitalRows.length,
  };
}

// --- Specialized Care (Specialities / Treatments tabs) ---------------------

export type SpecializedCareItem = {
  id: number;
  name: string;
  href: string;
  /** `null` when the CMS record has no logo/image set, or its value isn't one of our own uploaded paths (see `toLocalImageUrl`) — the caller falls back to a decorative icon, never a fabricated image. */
  imageUrl: string | null;
};

/**
 * `speciality_logo` is a free-text field in the admin (not a managed
 * upload picker with a whitelist of hosts), so it can and does contain
 * an arbitrary external URL pasted in by whoever entered the content —
 * confirmed in the live data (a `gstatic.com` search-thumbnail link and
 * an `iconscout.com` icon link on two active Specialities), neither of
 * which `next/image` can render without adding that exact external host
 * to `next.config.ts` for what would be one ad-hoc image. This project's
 * own uploads (via `storageProvider`, e.g. banners) always come back as
 * a same-origin `/uploads/...` path, so only a value shaped like that is
 * trusted as a real image here; anything else (including these two rows
 * today) is treated as "no image," same as a genuinely empty field —
 * the card falls back to its decorative icon rather than passing an
 * untrusted external URL to `next/image`.
 */
export function toLocalImageUrl(value: string | null): string | null {
  return value && value.startsWith("/") ? value : null;
}

/**
 * Hospitals' admin form (`components/admin/hospitals/HospitalFormDialog.tsx`)
 * is, by design, a raw external-URL text field — not a `FileUploadArea`
 * local upload like Specialities/Doctors/Blogs — so `hospital_image` is
 * never one of our own `/uploads/...` paths and `toLocalImageUrl` would
 * discard every legitimate value. Any non-empty string is trusted here;
 * `HospitalCard` renders it via a plain `<img>` rather than `next/image`
 * (see its own comment) since these URLs can be any host, not a fixed
 * allowlist.
 */
export function toHospitalImageUrl(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export type HomepageSpecializedCare = {
  specialities: SpecializedCareItem[];
  treatments: SpecializedCareItem[];
};

/**
 * Powers the homepage's tabbed "Specialized Care" section: two
 * independent, flat lists — Specialities and Treatments — each capped at
 * `SPECIALIZED_CARE_GRID_LIMIT`. (There is deliberately no Conditions tab
 * any more; the Symptom Checker data and admin are untouched.)
 *
 * Specialities/Treatments branch on `cityId`:
 * - `cityId === null` (the nationwide `/` homepage): reads
 *   `global_specialities`/`global_treatments` ONLY — the same tables
 *   `/specialities`, `/treatments`, and `/dcg/{seoUrl}` already use (see
 *   `lib/public/specialities.ts`'s `resolvePublicSpecialityListing` /
 *   `lib/public/treatments.ts`'s `resolvePublicTreatmentListing`, whose
 *   exact mapping this mirrors) — never the city-scoped `specialities`/
 *   `treatments` tables. An earlier version of this function pooled the
 *   city-scoped tables across every city when `cityId` was null and
 *   linked each card to THAT ROW's OWN city (`getSpecialityUrl(speciality
 *   .city.seo_url, …)`) — on the nationwide homepage that silently routed
 *   a visitor into a specific city's (e.g. Hyderabad's) speciality/
 *   treatment page the moment they clicked a card, which is exactly the
 *   "global page leaks one city's content" bug this must never do. Every
 *   card here now links to a real `/dcg/…` URL when `cityId` is null.
 * - A real `cityId`: unchanged from before — the city-scoped
 *   `specialities`/`treatments` tables, filtered to that one city,
 *   linking to that city's own `/{citySeoUrl}/specialities|treatments/…`
 *   URL. Top-level-only filtering (`parent_speciality_id === null`) stays
 *   in-memory after the existing `getSpecialities()` call for the same
 *   reason as before — its `ListSpecialitiesQuery` type has no way to
 *   express "IS NULL" server-side.
 */
export async function getHomepageSpecializedCare(cityId: number | null): Promise<HomepageSpecializedCare> {
  if (cityId === null) {
    const [{ items: specialityRows }, { items: treatmentRows }] = await Promise.all([
      getGlobalSpecialitiesPage({ page: 1, pageSize: SPECIALIZED_CARE_GRID_LIMIT }),
      getGlobalTreatmentsPage({ page: 1, pageSize: SPECIALIZED_CARE_GRID_LIMIT }),
    ]);

    const specialities = specialityRows.map((speciality) => ({
      id: speciality.id,
      name: speciality.speciality_title?.trim() || speciality.speciality_name,
      href: getGlobalSpecialityUrl(speciality.seo_url),
      imageUrl: toLocalImageUrl(speciality.card_icon),
    }));

    const treatments = treatmentRows.map((treatment) => {
      // A global treatment's URL is just its own slug now, whatever its speciality link.
      const href = getGlobalTreatmentUrl(treatment.seo_url);
      return {
        id: treatment.id,
        name: treatment.treatment_title?.trim() || treatment.treatment_name,
        href,
        imageUrl: toLocalImageUrl(treatment.card_icon),
      };
    });

    return { specialities, treatments };
  }

  const [specialityRows, treatmentRows] = await Promise.all([
    getSpecialities({ status: "active", city_id: cityId }),
    getTreatments({ status: "active", city_id: cityId }),
  ]);

  const specialities = specialityRows
    .filter((speciality) => speciality.parent_speciality_id === null)
    .slice(0, SPECIALIZED_CARE_GRID_LIMIT)
    .map((speciality) => ({
      id: speciality.id,
      name: speciality.speciality_title?.trim() || speciality.speciality_name,
      href: getSpecialityUrl(speciality.city.seo_url, speciality.seo_url),
      imageUrl: toLocalImageUrl(speciality.card_icon),
    }));

  const treatments = treatmentRows.slice(0, SPECIALIZED_CARE_GRID_LIMIT).map((treatment) => ({
    id: treatment.id,
    name: treatment.sub_speciality_title?.trim() || treatment.sub_speciality_name,
    href: getTreatmentUrl(treatment.city.seo_url, treatment.seo_url),
    imageUrl: toLocalImageUrl(treatment.card_icon),
  }));

  return { specialities, treatments };
}

// --- Doctors --------------------------------------------------------------

export type HomepageDoctor = {
  id: number;
  name: string;
  qualification: string | null;
  experience: string | null;
  /** Only populated when the real `patient_satisfaction_score` column has a value — never a fabricated figure or an assumed "/5"/"%" scale (the schema doesn't say which). */
  satisfactionScore: string | null;
  imageUrl: string | null;
  href: string;
  /** The doctor's first mapped `doctor_specialities` row (via `doctor_speciality_mappings`), or `null` if none is mapped. A doctor can have several; showing just one keeps the card's badge to a single clean pill instead of dumping every mapping in. */
  specialityName: string | null;
  /** The doctor's first mapped hospital (via `doctor_hospitals`, ordered by hospital_id), or `null` if none is mapped. Same "one clean line, not every hospital" reasoning as specialityName. */
  hospitalName: string | null;
  /** Only populated by the nationwide `/doctors` global listing (`lib/public/doctors.ts`'s `resolvePublicDoctorListing`) — `getHomepageDoctors` never sets it, since the homepage already has its own city context and repeating it on every card would be redundant. `DoctorCard` shows it only when present. */
  cityName?: string | null;
};

/**
 * `getDoctors()`'s own select never joins `doctor_hospitals`/
 * `doctor_speciality_mappings` (confirmed by reading services/doctor.service.ts —
 * it's shared with the admin list view, which doesn't need them there).
 * The relations DO already have dedicated, working service functions
 * (services/doctor-mapping.service.ts's getDoctorHospitals/
 * getDoctorSpecialityMappings, used by the admin's own mapping dialogs) —
 * reused here per-doctor rather than duplicating a new join query.
 */
export async function getHomepageDoctors(cityId: number | null): Promise<HomepageDoctor[]> {
  const rows = await getDoctors({ status: "active", ...(cityId !== null ? { city_id: cityId } : {}) });
  const doctors = rows.slice(0, HOMEPAGE_LIST_LIMIT);

  const [hospitalsByDoctor, specialitiesByDoctor] = await Promise.all([
    Promise.all(doctors.map((doctor) => getDoctorHospitals(doctor.id))),
    Promise.all(doctors.map((doctor) => getDoctorSpecialityMappings(doctor.id))),
  ]);

  return doctors.map((doctor, index) => ({
    id: doctor.id,
    name: doctor.doctor_name,
    qualification: doctor.qualification,
    experience: doctor.experience,
    satisfactionScore: doctor.patient_satisfaction_score != null ? doctor.patient_satisfaction_score.toString() : null,
    imageUrl: toLocalImageUrl(doctor.doctor_image),
    href: getDoctorUrl(doctor.city.seo_url, doctor.seo_url),
    specialityName: specialitiesByDoctor[index][0]?.speciality_name ?? null,
    hospitalName: hospitalsByDoctor[index][0]?.hospital_name ?? null,
  }));
}

// --- Hospitals / Locations ---------------------------------------------------

export type HomepageHospital = {
  id: number;
  name: string;
  href: string;
  /** `null` only when the CMS record has no image set (see `toHospitalImageUrl`) — the caller falls back to a decorative treatment, never a fabricated image. Unlike other homepage sections, this can be any external URL: Hospitals' admin form is a raw URL field by design, not a local upload. */
  imageUrl: string | null;
  address: string | null;
  cityName: string;
  /** Only populated when the real `google_reviews` column has a value — never a fabricated rating. */
  googleReviews: string | null;
};

/**
 * Real active Hospitals for the current city. `getHospitals()` accepts no
 * filter, so city matching happens here, same established pattern as
 * banners/locations. `cityId: null` (no city context, the nationwide `/`
 * homepage) always yields an empty list — a "Hospitals in your city"
 * section has no sensible nationwide-mixed rendering, unlike sections
 * such as Specialities/Treatments that fall back to an unfiltered list.
 *
 * `href` uses the locked `/{citySeoUrl}/hospitals/{hospitalSeoUrl}`
 * pattern (`getHospitalUrl`) — note that no page currently implements
 * that route (confirmed: no matching file under `app/(public)/`), so
 * this link 404s today. That's a pre-existing gap in a different part of
 * the build, not something to route around here.
 */
export async function getHomepageHospitals(cityId: number | null): Promise<HomepageHospital[]> {
  if (cityId === null) return [];

  const hospitals = await getHospitals();

  return hospitals
    .filter((hospital) => hospital.status === "active" && hospital.city_id === cityId)
    .slice(0, HOMEPAGE_LIST_LIMIT)
    .map((hospital) => ({
      id: hospital.id,
      name: hospital.hospital_name,
      href: getHospitalUrl(hospital.cities.seo_url, hospital.seo_url),
      imageUrl: toHospitalImageUrl(hospital.hospital_image),
      address: hospital.address?.trim() || null,
      cityName: hospital.cities.city_name,
      googleReviews: hospital.google_reviews != null ? hospital.google_reviews.toString() : null,
    }));
}

// --- Reviews (patient testimonials showcase) --------------------------------

export type HomepageReview = {
  id: number;
  text: string;
  /** `testimonials` has no rating column (unlike `google_reviews`, which this section used before) — always `null`. Kept for shape stability; the showcase UI doesn't display a rating. */
  rating: string | null;
  /** The testimonial's real associated city name — `city_id` is a required FK on `testimonials`, so this is never invented free text (contrast the old `google_reviews.google_location`, which was an unreliable free-text field). */
  location: string | null;
  /** `null` when `testimonial_name` is somehow blank — the card falls back to initials, never a fabricated name. */
  author: string | null;
  /** `null` when the CMS record has no photo uploaded, or its value isn't one of our own uploaded paths (see `toLocalImageUrl`) — the caller falls back to an initials avatar, never a fabricated photo. */
  avatar: string | null;
};

/**
 * `description` is authored as rich HTML (the admin's Tiptap editor) with
 * no server-side sanitizer in this project — per the public-rendering
 * security rule, it is never passed to `dangerouslySetInnerHTML`. This
 * strips markup down to plain text for safe display via ordinary JSX
 * text interpolation (React escapes it automatically); it is a plain-text
 * extractor, not a sanitizer, and must never be used to justify raw HTML
 * rendering.
 */
export function stripHtmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Same no-sanitizer-so-never-`dangerouslySetInnerHTML` constraint as
 * `stripHtmlToPlainText`, but splits on block-level boundaries (`</p>`,
 * `<br>`) *before* stripping the remaining inline tags, so a multi-
 * paragraph Tiptap description can render as separate `<p>` elements in
 * plain JSX instead of one run-on line. Each returned string is still
 * plain text (each chunk is passed through `stripHtmlToPlainText`); empty
 * chunks (from trailing `<p></p>` etc.) are dropped.
 */
export function splitHtmlToParagraphs(html: string): string[] {
  return html
    .split(/<\/p\s*>|<br\s*\/?>/gi)
    .map((chunk) => stripHtmlToPlainText(chunk))
    .filter((chunk) => chunk.length > 0);
}

/**
 * Real active patient Testimonials — switched from `google_reviews` (which
 * has no reviewer-name or photo column at all, ever) since the showcase
 * needs a real author name and an optional avatar per review, and
 * `testimonials` is the one CMS entity that actually carries both
 * (`testimonial_name`, `testimonial_image`) alongside a real `city_id` FK.
 * Deliberately takes NO `cityId` parameter, same as the section it
 * replaces — every route (`/`, `/hyderabad`, `/mumbai`) sees the same
 * active set rather than a per-city subset, since this is a small,
 * nationwide "what patients say" showcase, not a per-city listing.
 *
 * Text reviews only — `testimonials` has no dedicated review-type column,
 * but a real `youtube_url` is exactly what makes a record a video
 * testimonial (confirmed against the live data: e.g. "Laparoscopic
 * Surgery Patient Video 01" has `youtube_url` set and a `description` of
 * just "Patient video testimonial for Laparoscopic Surgery care." — a
 * caption, not a written review). Filtered out here, before mapping, so
 * a video testimonial can never end up in this showcase's array at all —
 * not filtered client-side, and never eligible to land at index 0 (the
 * carousel's default active review) or anywhere else in rotation.
 */
export async function getHomepageReviews(): Promise<HomepageReview[]> {
  const rows = await getTestimonials({ status: "active" });

  return rows
    .filter((testimonial) => !testimonial.youtube_url?.trim())
    .map((testimonial) => ({
      id: testimonial.id,
      text: testimonial.description ? stripHtmlToPlainText(testimonial.description) : "",
      rating: null,
      location: testimonial.city.city_name,
      author: testimonial.testimonial_name?.trim() || null,
      avatar: toLocalImageUrl(testimonial.testimonial_image),
    }))
    // A testimonial with no review text has nothing for the showcase to display.
    .filter((review) => review.text.length > 0)
    .slice(0, HOMEPAGE_LIST_LIMIT);
}

// --- Blogs ------------------------------------------------------------------

export type HomepageBlog = {
  id: number;
  title: string;
  /** `meta_description` only — never `blog_text` (the full rich-HTML article body), which never belongs on the homepage. */
  excerpt: string | null;
  imageUrl: string | null;
  publishedDate: Date | null;
  href: string;
  /** The blog's category name only, as a plain editorial label — not a link. `/blogs/category/{seo_url}` has no page built yet (same gap as `/blogs` itself), so nothing here points at it. */
  categoryName: string | null;
  /** Only rendered by `BlogCard` when its `showExcerptAndAuthor` prop is explicitly set — added for the Blog Listing page, backward-compatible no-op everywhere else this DTO/card is already used (Homepage, Speciality, Treatment, Blog Detail's Related section). */
  authorName: string | null;
  authorImageUrl: string | null;
};

/**
 * Real active Blogs. `blogs.city_id` is a required (non-nullable) column
 * — confirmed by reading the schema — so, like Specialities/Treatments/
 * Doctors, a real cityId genuinely filters to that city alone; `cityId:
 * null` (the nationwide `/` homepage) falls back to the existing
 * unfiltered-across-cities convention already used by those sections.
 */
export async function getHomepageBlogs(cityId: number | null): Promise<HomepageBlog[]> {
  const rows = await getBlogs({ blog_status: "active", ...(cityId !== null ? { city_id: cityId } : {}) });

  return rows.slice(0, HOMEPAGE_BLOG_LIMIT).map((blog) => ({
    id: blog.id,
    title: blog.blog_title,
    excerpt: blog.meta_description?.trim() || null,
    imageUrl: toLocalImageUrl(blog.blog_image),
    publishedDate: blog.published_date,
    href: getBlogUrl(blog.seo_url),
    categoryName: blog.category?.category_name ?? null,
    authorName: blog.author_name?.trim() || null,
    authorImageUrl: toLocalImageUrl(blog.author_image),
  }));
}

// --- Consultation card quick-pick areas ------------------------------------

export type HomepageArea = { name: string };

/**
 * Real active `locations` (areas) within the current city, for the Hero
 * discovery strip's quick-pick row. `getLocations()` accepts no filter,
 * so it's applied here — same established pattern as `getHomepageBanner`.
 * `cityId: null` (no city context) always yields an empty list rather
 * than mixing areas from every city into one non-sensical list.
 */
export async function getHomepageCityAreas(cityId: number | null): Promise<HomepageArea[]> {
  if (cityId === null) return [];

  const locations = await getLocations();

  return locations
    .filter((location) => location.status === "active" && location.city_id === cityId)
    .slice(0, HOMEPAGE_LIST_LIMIT)
    .map((location) => ({ name: location.area }));
}

// --- FAQs ---------------------------------------------------------------

export type HomepageFaq = { id: number; question: string; answer: string };

/**
 * `general_faqs` — the one FAQ source that is genuinely homepage-shaped:
 * it is not scoped to one specific speciality/treatment/hospital, so it
 * applies to the site as a whole and needs no city filter (unlike
 * `speciality_faqs`/`treatment_faqs`/`hospital_faqs`, which only make
 * sense attached to the one detail page they were written for). There is
 * also no `city_id` column on `general_faqs` at all (confirmed by reading
 * the schema), so this couldn't be city-filtered even if it should be.
 *
 * `answer` is authored via a plain `<Textarea>` in the admin (confirmed
 * by reading GeneralFaqFormDialog.tsx — not the Tiptap rich-text editor
 * used elsewhere), so it's genuinely plain text already; `stripHtmlToPlainText`
 * is still applied for the same collapsed-whitespace/`&nbsp;`-handling
 * reasons `getHomepageTestimonials` applies it to `description`, and
 * because it's a harmless no-op on text with no markup to strip.
 *
 * Capped at `HOMEPAGE_FAQ_LIMIT`, same "keep the homepage lean" reasoning
 * as `HOMEPAGE_LIST_LIMIT`, and ordered exactly as `getGeneralFaqs()`
 * already returns them (`id` ascending) — no new sort invented here.
 */
export async function getHomepageFaqs(): Promise<HomepageFaq[]> {
  const rows = await getGeneralFaqs({ status: "active" });

  return rows
    .slice(0, HOMEPAGE_FAQ_LIMIT)
    .map((faq) => ({
      id: faq.id,
      question: faq.question.trim(),
      answer: stripHtmlToPlainText(faq.answer),
    }))
    .filter((faq) => faq.question.length > 0 && faq.answer.length > 0);
}
