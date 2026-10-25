import { cache } from "react";
import { sanitizeHtmlServer } from "@/lib/sanitize-html.server";
import {
  getSpecialities,
  getSpecialityBySeoUrl,
} from "@/services/speciality.service";
import { getHospitalById } from "@/services/hospital.service";
import { getTreatments } from "@/services/treatment.service";
import { getSpecialitySymptoms } from "@/services/speciality-symptom.service";
import { getOrCreateSpecialitySections } from "@/services/speciality-section.service";
import type {
  CtaSectionContent,
  CustomSectionContent,
  WhyChooseUsIconKey,
  WhyChooseUsSectionContent,
} from "@/validators/speciality-section.validator";
import { getDoctorsByDoctorSpeciality } from "@/services/doctor-mapping.service";
import { getSpecialityFaqs } from "@/services/speciality-faq.service";
import { getTestimonials } from "@/services/testimonial.service";
import { getBlogs } from "@/services/blog.service";
import { getGlobalSpecialitiesPage } from "@/services/global-speciality.service";
import {
  getDoctorUrl,
  getGlobalSpecialityUrl,
  getHospitalUrl,
  getSpecialityUrl,
  getTreatmentUrl,
  getBlogUrl,
} from "@/lib/public/urls";
import { toHospitalImageUrl, toLocalImageUrl, stripHtmlToPlainText, splitHtmlToParagraphs } from "@/lib/public/homepage";
import type { HomepageBlog, HomepageDoctor } from "@/lib/public/homepage";

/**
 * Public data layer for Specialities — both the
 * `/{citySeoUrl}/specialities/{seoUrl}` Detail page and the nationwide
 * `/specialities` Listing page. Same "call the existing admin service,
 * reshape into a public-safe DTO" convention as every other
 * `lib/public/*.ts` resolver.
 *
 * The Detail page's section order is fully CMS-driven
 * (`buildSpecialitySectionOrder`): the 8 orderable fixed types (hero,
 * overview, treatments, symptoms, why_choose_us, doctors, hospital, faqs
 * — `cta` is deliberately excluded, it's always rendered separately,
 * last) plus any active `custom` rows, sorted by `section_order`, with
 * the 3 non-CMS static sections (testimonials, relatedCities, blogs)
 * appended after them in a fixed sequence.
 */

// --- Speciality Detail (/{citySeoUrl}/specialities/{specialitySeoUrl}) -----

export type PublicSpecialityWhyChooseUsIconKey = WhyChooseUsIconKey;

export type PublicSpecialityWhyChooseUsItem = {
  title: string;
  description: string;
  iconKey: string;
};

export type PublicSpecialityWhyChooseUs = {
  heading: string | null;
  items: PublicSpecialityWhyChooseUsItem[];
} | null;

export type PublicSpecialityCta = {
  heading: string | null;
  description: string | null;
  items: PublicSpecialityWhyChooseUsItem[];
  buttonText: string | null;
  buttonUrl: string | null;
};

export type PublicSpecialitySymptom = {
  id: number;
  name: string;
  imageUrl: string | null;
};

export type PublicSpecialityTreatmentCard = {
  id: number;
  href: string;
  name: string;
  imageUrl: string | null;
  shortDescription: string | null;
};

/** Superset of `HomepageHospital` (structurally assignable to `HospitalCard`'s prop type) plus `phoneNumber`, which only `SpecialityHero` needs. */
export type PublicSpecialityHospital = {
  id: number;
  name: string;
  href: string;
  imageUrl: string | null;
  address: string | null;
  cityName: string;
  googleReviews: string | null;
  phoneNumber: string | null;
};

export type PublicSpecialityFaq = {
  id: number;
  title: string;
  text: string;
};

export type PublicSpecialityTestimonial = {
  id: number;
  text: string;
  author: string | null;
  avatar: string | null;
  location: string | null;
  youtubeVideoId: string | null;
};

export type PublicSpecialityRelatedCity = {
  citySeoUrl: string;
  cityName: string;
  href: string;
};

export type PublicSpecialitySectionItem =
  | { kind: "hero" }
  | { kind: "overview" }
  | { kind: "treatments" }
  | { kind: "symptoms" }
  | { kind: "doctors" }
  | { kind: "hospital" }
  | { kind: "faqs" }
  | { kind: "why_choose_us" }
  | { kind: "testimonials" }
  | { kind: "relatedCities" }
  | { kind: "blogs" }
  | { kind: "custom"; id: number; title: string; contentHtml: string; imageUrl: string | null };

export type PublicSpecialityDetail = {
  id: number;
  name: string;
  seoUrl: string;
  citySeoUrl: string;
  cityId: number;
  cityName: string;
  imageUrl: string | null;
  shortDescription: string | null;
  /** `description` rich HTML, pre-split into plain-text paragraphs — never raw HTML, no sanitizer exists in this project. */
  description: string[];
  symptoms: PublicSpecialitySymptom[];
  treatments: PublicSpecialityTreatmentCard[];
  doctors: HomepageDoctor[];
  hospital: PublicSpecialityHospital | null;
  whyChooseUs: PublicSpecialityWhyChooseUs;
  faqs: PublicSpecialityFaq[];
  testimonials: PublicSpecialityTestimonial[];
  /** Whether `testimonials` came from a direct `speciality_id` match (true) or the city-wide fallback (false) — only changes which heading copy is shown. */
  testimonialsAreSpecialitySpecific: boolean;
  relatedCities: PublicSpecialityRelatedCity[];
  blogs: HomepageBlog[];
  sections: PublicSpecialitySectionItem[];
  ctaEnabled: boolean;
  cta: PublicSpecialityCta;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeyword: string | null;
};

export type SpecialityLookupResult =
  | { status: "not-found" }
  | { status: "wrong-city"; canonicalCitySeoUrl: string; canonicalSeoUrl: string }
  | { status: "ok"; detail: PublicSpecialityDetail };

const RELATED_BLOGS_LIMIT = 3;

function extractYoutubeVideoId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function toSpecialityBlogCard(row: Awaited<ReturnType<typeof getBlogs>>[number]): HomepageBlog {
  return {
    id: row.id,
    title: row.blog_title,
    excerpt: row.meta_description?.trim() || null,
    imageUrl: toLocalImageUrl(row.blog_image),
    publishedDate: row.published_date,
    href: getBlogUrl(row.seo_url),
    categoryName: row.category?.category_name ?? null,
    authorName: row.author_name?.trim() || null,
    authorImageUrl: toLocalImageUrl(row.author_image),
  };
}

const FIXED_SECTION_ORDER_KINDS = [
  "hero",
  "overview",
  "treatments",
  "symptoms",
  "why_choose_us",
  "doctors",
  "hospital",
  "faqs",
] as const;

/**
 * Full resolve for a Speciality Detail page. `getSpecialityBySeoUrl` is
 * active-only, so a miss is "not found"; a hit under the wrong city
 * redirects to its canonical city URL — same precedent as every other
 * city-prefixed detail resolver.
 */
export async function resolvePublicSpeciality(citySeoUrl: string, specialitySeoUrl: string): Promise<SpecialityLookupResult> {
  const speciality = await getSpecialityBySeoUrl(specialitySeoUrl);

  if (!speciality) {
    return { status: "not-found" };
  }

  if (speciality.city.seo_url !== citySeoUrl) {
    return { status: "wrong-city", canonicalCitySeoUrl: speciality.city.seo_url, canonicalSeoUrl: speciality.seo_url };
  }

  const [symptomRows, realTreatmentRows, sections, faqRows, linkedTestimonials, blogRows, hospital, doctorRows, relatedRows] =
    await Promise.all([
      getSpecialitySymptoms({ speciality_id: speciality.id, status: "active" }),
      getTreatments({ speciality_id: speciality.id, status: "active" }),
      getOrCreateSpecialitySections(speciality.id),
      getSpecialityFaqs({ speciality_id: speciality.id }),
      getTestimonials({ speciality_id: speciality.id, status: "active" }),
      // Related Reading — a blog must be EXPLICITLY associated (via
      // blog_global_speciality_mappings) with the GLOBAL speciality this
      // city speciality links to, AND belong to this same city (existing
      // city-scoped blog eligibility, unchanged). No link set at all ->
      // no way to determine topical relevance, so no blogs at all rather
      // than guessing from category/city alone (see this function's own
      // "never fabricate" precedent elsewhere on this page).
      speciality.global_speciality_id !== null
        ? getBlogs({
            blog_status: "active",
            city_id: speciality.city_id,
            related_global_speciality_id: speciality.global_speciality_id,
          })
        : Promise.resolve([]),
      speciality.hospital && speciality.hospital.status === "active" ? getHospitalById(speciality.hospital.id) : null,
      speciality.doctorSpeciality
        ? getDoctorsByDoctorSpeciality(speciality.doctorSpeciality.id, speciality.city_id)
        : Promise.resolve([]),
      getSpecialities({ status: "active" }),
    ]);

  const testimonialsAreSpecialitySpecific = linkedTestimonials.length > 0;
  const testimonialRows = testimonialsAreSpecialitySpecific
    ? linkedTestimonials
    : await getTestimonials({ city_id: speciality.city_id, status: "active" });

  const symptoms: PublicSpecialitySymptom[] = symptomRows.map((symptom) => ({
    id: symptom.id,
    name: symptom.name,
    imageUrl: toLocalImageUrl(symptom.image),
  }));

  const treatments: PublicSpecialityTreatmentCard[] = realTreatmentRows.map((treatment) => ({
    id: treatment.id,
    href: getTreatmentUrl(treatment.city.seo_url, treatment.seo_url),
    name: treatment.sub_speciality_title?.trim() || treatment.sub_speciality_name,
    imageUrl: toLocalImageUrl(treatment.card_icon),
    shortDescription: treatment.short_description?.trim() || null,
  }));

  const doctorSpecialityName = speciality.doctorSpeciality?.speciality_name ?? speciality.speciality_name;
  const doctors: HomepageDoctor[] = doctorRows.map((doctor) => ({
    id: doctor.id,
    name: doctor.doctor_name,
    qualification: doctor.qualification,
    experience: doctor.experience,
    satisfactionScore: doctor.patient_satisfaction_score != null ? doctor.patient_satisfaction_score.toString() : null,
    imageUrl: toLocalImageUrl(doctor.doctor_image),
    href: getDoctorUrl(doctor.cities.seo_url, doctor.seo_url),
    specialityName: doctorSpecialityName,
    hospitalName: null,
  }));

  const faqs: PublicSpecialityFaq[] = faqRows
    .filter((faq) => faq.status === "active")
    .map((faq) => ({ id: faq.id, title: faq.title, text: faq.text }));

  const testimonials: PublicSpecialityTestimonial[] = testimonialRows
    .map((testimonial) => ({
      id: testimonial.id,
      text: testimonial.description ? stripHtmlToPlainText(testimonial.description) : "",
      author: testimonial.testimonial_name?.trim() || null,
      avatar: toLocalImageUrl(testimonial.testimonial_image),
      location: testimonial.city.city_name,
      youtubeVideoId: extractYoutubeVideoId(testimonial.youtube_url),
    }))
    .filter((testimonial) => testimonial.text.length > 0 || testimonial.youtubeVideoId !== null);

  const relatedCities: PublicSpecialityRelatedCity[] = relatedRows
    .filter((row) => row.speciality_name === speciality.speciality_name && row.city.id !== speciality.city_id)
    .map((row) => ({
      citySeoUrl: row.city.seo_url,
      cityName: row.city.city_name,
      href: getSpecialityUrl(row.city.seo_url, row.seo_url),
    }));

  const blogs: HomepageBlog[] = blogRows.slice(0, RELATED_BLOGS_LIMIT).map(toSpecialityBlogCard);

  const whyChooseUsSection = sections.find((section) => section.section_type === "why_choose_us");
  const ctaSection = sections.find((section) => section.section_type === "cta");
  const whyChooseUsContent = (whyChooseUsSection?.content ?? null) as WhyChooseUsSectionContent | null;
  const ctaContent = (ctaSection?.content ?? null) as CtaSectionContent | null;

  const whyChooseUs: PublicSpecialityWhyChooseUs =
    whyChooseUsSection?.status === "active" && whyChooseUsContent && whyChooseUsContent.items.length > 0
      ? {
          heading: whyChooseUsContent.heading?.trim() || null,
          items: whyChooseUsContent.items.map((item) => ({
            title: item.title,
            description: item.description,
            iconKey: item.icon_key,
          })),
        }
      : null;

  const orderedSections: PublicSpecialitySectionItem[] = sections
    .filter((section) => section.status === "active" && section.section_type !== "cta")
    .map((section): PublicSpecialitySectionItem | null => {
      if (section.section_type === "custom") {
        const content = section.content as CustomSectionContent | null;
        if (!content) return null;
        return {
          kind: "custom",
          id: section.id,
          title: content.title,
          contentHtml: sanitizeHtmlServer(content.content),
          imageUrl: toLocalImageUrl(content.image ?? null),
        };
      }

      if ((FIXED_SECTION_ORDER_KINDS as readonly string[]).includes(section.section_type)) {
        return { kind: section.section_type as (typeof FIXED_SECTION_ORDER_KINDS)[number] };
      }

      return null;
    })
    .filter((item): item is PublicSpecialitySectionItem => item !== null);

  const detail: PublicSpecialityDetail = {
    id: speciality.id,
    name: speciality.speciality_title?.trim() || speciality.speciality_name,
    seoUrl: speciality.seo_url,
    citySeoUrl: speciality.city.seo_url,
    cityId: speciality.city.id,
    cityName: speciality.city.city_name,
    imageUrl: toLocalImageUrl(speciality.speciality_logo),
    shortDescription: speciality.short_description?.trim() || null,
    description: speciality.description ? splitHtmlToParagraphs(speciality.description) : [],
    symptoms,
    treatments,
    doctors,
    hospital: hospital
      ? {
          id: hospital.id,
          name: hospital.hospital_name,
          href: getHospitalUrl(hospital.cities.seo_url, hospital.seo_url),
          imageUrl: toHospitalImageUrl(hospital.hospital_image),
          address: hospital.address?.trim() || null,
          cityName: hospital.cities.city_name,
          googleReviews: hospital.google_reviews != null ? hospital.google_reviews.toString() : null,
          phoneNumber: hospital.phone_number?.trim() || null,
        }
      : null,
    whyChooseUs,
    faqs,
    testimonials,
    testimonialsAreSpecialitySpecific,
    relatedCities,
    blogs,
    sections: [...orderedSections, { kind: "testimonials" }, { kind: "relatedCities" }, { kind: "blogs" }],
    ctaEnabled: ctaSection?.status === "active",
    cta: {
      heading: ctaContent?.heading?.trim() || null,
      description: ctaContent?.description?.trim() || null,
      items: (ctaContent?.items ?? []).map((item) => ({
        title: item.title,
        description: item.description,
        iconKey: item.icon_key,
      })),
      buttonText: ctaContent?.button_text?.trim() || null,
      buttonUrl: ctaContent?.button_url?.trim() || null,
    },
    metaTitle: speciality.meta_title?.trim() || null,
    metaDescription: speciality.meta_description?.trim() || null,
    metaKeyword: speciality.meta_keyword?.trim() || null,
  };

  return { status: "ok", detail };
}

export const getCachedPublicSpeciality = cache((citySeoUrl: string, specialitySeoUrl: string) =>
  resolvePublicSpeciality(citySeoUrl, specialitySeoUrl)
);

// --- Speciality Listing (/specialities) --------------------------------------

const SPECIALITY_LISTING_PAGE_SIZE = 12;

export type PublicGlobalListingCard = {
  id: number;
  name: string;
  seoUrl: string;
  href: string;
  shortDescription: string | null;
  imageUrl: string | null;
};

export type PublicSpecialityListing = {
  items: PublicGlobalListingCard[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

/**
 * Nationwide `/specialities` listing — active Global Specialities ONLY
 * (`global_specialities`). Never the city-scoped `specialities` table:
 * same "never derive global content from a city row" rule
 * `lib/public/global-content.ts` enforces for `/dcg/{seoUrl}`.
 */
export async function resolvePublicSpecialityListing(page: number): Promise<PublicSpecialityListing> {
  const { items: rows, total } = await getGlobalSpecialitiesPage({ page, pageSize: SPECIALITY_LISTING_PAGE_SIZE });

  const items: PublicGlobalListingCard[] = rows.map((row) => ({
    id: row.id,
    name: row.speciality_title?.trim() || row.speciality_name,
    seoUrl: row.seo_url,
    href: getGlobalSpecialityUrl(row.seo_url),
    shortDescription: row.short_description?.trim() || null,
    // Listing card shows the hero image, falling back to the card icon, then the card's default icon. Homepage cards use their own resolver (lib/public/homepage.ts) and are unaffected.
    imageUrl: toLocalImageUrl(row.image) ?? toLocalImageUrl(row.card_icon),
  }));

  return {
    items,
    page,
    pageSize: SPECIALITY_LISTING_PAGE_SIZE,
    totalCount: total,
    totalPages: Math.max(1, Math.ceil(total / SPECIALITY_LISTING_PAGE_SIZE)),
  };
}

export const getCachedPublicSpecialityListing = cache((page: number) => resolvePublicSpecialityListing(page));

/**
 * `/{citySeoUrl}/specialities` — one city's active, top-level specialities
 * (`specialities` rows for that `city_id`, never `global_specialities`),
 * shaped as the same card DTO the nationwide listing uses. Hero image
 * first, then the card icon, then the card's default icon.
 */
export async function resolvePublicCitySpecialityCards(cityId: number): Promise<PublicGlobalListingCard[]> {
  const rows = await getSpecialities({ status: "active", city_id: cityId });

  return rows
    .filter((row) => row.parent_speciality_id === null)
    .map((row) => ({
      id: row.id,
      name: row.speciality_title?.trim() || row.speciality_name,
      seoUrl: row.seo_url,
      href: getSpecialityUrl(row.city.seo_url, row.seo_url),
      shortDescription: row.short_description?.trim() || null,
      imageUrl: toLocalImageUrl(row.speciality_logo) ?? toLocalImageUrl(row.card_icon),
    }));
}
