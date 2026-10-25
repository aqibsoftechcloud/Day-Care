import { cache } from "react";
import { sanitizeHtmlServer } from "@/lib/sanitize-html.server";
import { getTreatmentBySeoUrl, getTreatments } from "@/services/treatment.service";
import { getHospitalById } from "@/services/hospital.service";
import { getTreatmentSymptoms } from "@/services/treatment-symptom.service";
import { getOrCreateTreatmentSections } from "@/services/treatment-section.service";
import type {
  CtaSectionContent,
  CustomSectionContent,
  EligibilitySectionContent,
  FactsSectionContent,
  HighlightsSectionContent,
  JourneySectionContent,
  OptionsSectionContent,
  PreparationRecoverySectionContent,
  ProcessSectionContent,
  WhyChooseUsSectionContent,
} from "@/validators/treatment-section.validator";
import type { WhyChooseUsIconKey } from "@/validators/speciality-section.validator";
import { getDoctorsByDoctorSpeciality } from "@/services/doctor-mapping.service";
import { getTreatmentFaqs } from "@/services/treatment-faq.service";
import { getBlogs } from "@/services/blog.service";
import { getGlobalTreatmentsPage } from "@/services/global-treatment.service";
import {
  getBlogUrl,
  getDoctorUrl,
  getGlobalTreatmentUrl,
  getHospitalUrl,
  getTreatmentUrl,
} from "@/lib/public/urls";
import { toHospitalImageUrl, toLocalImageUrl } from "@/lib/public/homepage";
import type { HomepageBlog, HomepageDoctor, HomepageHospital } from "@/lib/public/homepage";

/**
 * Public data layer for Treatments — both the
 * `/{citySeoUrl}/treatments/{seoUrl}` Detail page and the nationwide
 * `/treatments` Listing page. Same "call the existing admin service,
 * reshape into a public-safe DTO" convention as every other
 * `lib/public/*.ts` resolver.
 *
 * The Detail page's section order is fully CMS-driven: the 14 orderable
 * fixed types (hero, highlights, overview, facts, symptoms, options,
 * eligibility, why_choose_us, doctors, process, journey, hospital,
 * preparation_recovery, faqs — `cta` is excluded, always rendered
 * separately, last) plus any active `custom` rows, sorted by
 * `section_order`. Unlike Speciality, Related Treatments/Related
 * Speciality/Related Cities/Blogs are NOT part of `detail.sections` — they
 * have no `section_type` of their own and are always rendered in a fixed
 * position at the bottom of the page (see `TreatmentDetailPage.tsx`).
 */

// --- Treatment Detail (/{citySeoUrl}/treatments/{treatmentSeoUrl}) ---------

export type PublicTreatmentWhyChooseUsIconKey = WhyChooseUsIconKey;

export type PublicTreatmentLabelValueItem = {
  label: string;
  value: string;
};

export type PublicTreatmentSymptom = {
  id: number;
  name: string;
  imageUrl: string | null;
};

export type PublicTreatmentOptions = {
  heading: string | null;
  items: { title: string; description: string; points: string[] }[];
} | null;

export type PublicTreatmentEligibility = {
  heading: string | null;
  intro: string | null;
  indicators: string[];
  note: string | null;
} | null;

export type PublicTreatmentWhyChooseUsItem = {
  title: string;
  description: string;
  iconKey: string;
};

export type PublicTreatmentWhyChooseUs = {
  heading: string | null;
  items: PublicTreatmentWhyChooseUsItem[];
} | null;

export type PublicTreatmentProcess = {
  heading: string | null;
  items: { title: string; description: string }[];
} | null;

export type PublicTreatmentJourneyStep = {
  duration: string;
  title: string;
  iconKey: string;
  points: string[];
};

export type PublicTreatmentJourney = {
  heading: string | null;
  steps: PublicTreatmentJourneyStep[];
} | null;

export type PublicTreatmentPreparationRecoveryGroup = {
  title: string;
  intro: string | null;
  items: string[];
};

export type PublicTreatmentCta = {
  heading: string | null;
  description: string | null;
  items: PublicTreatmentWhyChooseUsItem[];
  buttonText: string | null;
  buttonUrl: string | null;
};

export type PublicTreatmentFaq = {
  id: number;
  title: string;
  text: string;
};

export type PublicTreatmentRelatedTreatment = {
  href: string;
  name: string;
  description: string | null;
  /** Real `treatments.card_icon` — the sibling's dedicated listing-card icon, NOT its `speciality_logo` hero (which is what the main treatment's own `imageUrl` uses). `null` -> the card's default icon. */
  imageUrl: string | null;
};

export type PublicTreatmentRelatedCity = {
  citySeoUrl: string;
  cityName: string;
  href: string;
};

export type PublicTreatmentDoctor = HomepageDoctor;
export type PublicTreatmentBlog = HomepageBlog;

export type PublicTreatmentSectionItem =
  | { kind: "hero" }
  | { kind: "highlights" }
  | { kind: "overview" }
  | { kind: "facts" }
  | { kind: "symptoms" }
  | { kind: "options" }
  | { kind: "eligibility" }
  | { kind: "why_choose_us" }
  | { kind: "doctors" }
  | { kind: "process" }
  | { kind: "journey" }
  | { kind: "hospital" }
  | { kind: "preparation_recovery" }
  | { kind: "faqs" }
  | { kind: "custom"; id: number; title: string; contentHtml: string; imageUrl: string | null };

export type PublicTreatmentDetail = {
  id: number;
  name: string;
  seoUrl: string;
  citySeoUrl: string;
  cityId: number;
  cityName: string;
  specialityName: string;
  specialitySeoUrl: string;
  specialityCitySeoUrl: string;
  shortDescription: string | null;
  /** `treatments.description` rendered as real rich HTML, never stripped to plain paragraphs (unlike Speciality's own Overview). */
  descriptionHtml: string | null;
  /** `treatments.speciality_logo` — same single-image field Speciality uses, reused here both for Overview's side image and the Medical Illustration section. */
  imageUrl: string | null;
  highlights: PublicTreatmentLabelValueItem[];
  facts: PublicTreatmentLabelValueItem[];
  symptoms: PublicTreatmentSymptom[];
  options: PublicTreatmentOptions;
  eligibility: PublicTreatmentEligibility;
  whyChooseUs: PublicTreatmentWhyChooseUs;
  doctors: HomepageDoctor[];
  process: PublicTreatmentProcess;
  journey: PublicTreatmentJourney;
  hospital: HomepageHospital | null;
  preparationRecovery: PublicTreatmentPreparationRecoveryGroup[];
  faqs: PublicTreatmentFaq[];
  relatedTreatments: PublicTreatmentRelatedTreatment[];
  relatedCities: PublicTreatmentRelatedCity[];
  blogs: HomepageBlog[];
  sections: PublicTreatmentSectionItem[];
  ctaEnabled: boolean;
  cta: PublicTreatmentCta;
  metaTitle: string | null;
  metaDescription: string | null;
};

export type TreatmentLookupResult =
  | { status: "not-found" }
  | { status: "wrong-city"; canonicalCitySeoUrl: string; canonicalSeoUrl: string }
  | { status: "ok"; detail: PublicTreatmentDetail };

function toTreatmentBlogCard(row: Awaited<ReturnType<typeof getBlogs>>[number]): HomepageBlog {
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
  "highlights",
  "overview",
  "facts",
  "symptoms",
  "options",
  "eligibility",
  "why_choose_us",
  "doctors",
  "process",
  "journey",
  "hospital",
  "preparation_recovery",
  "faqs",
] as const;

/**
 * Full resolve for a Treatment Detail page. `getTreatmentBySeoUrl` is
 * active-only, so a miss is "not found"; a hit under the wrong city
 * redirects to its canonical city URL — same precedent as every other
 * city-prefixed detail resolver.
 */
export async function resolvePublicTreatment(citySeoUrl: string, treatmentSeoUrl: string): Promise<TreatmentLookupResult> {
  const treatment = await getTreatmentBySeoUrl(treatmentSeoUrl);

  if (!treatment) {
    return { status: "not-found" };
  }

  if (treatment.city.seo_url !== citySeoUrl) {
    return { status: "wrong-city", canonicalCitySeoUrl: treatment.city.seo_url, canonicalSeoUrl: treatment.seo_url };
  }

  const [symptomRows, sections, faqRows, blogRows, hospital, doctorRows, siblingTreatmentRows, allActiveTreatmentRows] =
    await Promise.all([
      getTreatmentSymptoms({ treatment_id: treatment.id, status: "active" }),
      getOrCreateTreatmentSections(treatment.id),
      getTreatmentFaqs({ treatment_id: treatment.id, status: "active" }),
      // Related Reading — same rule as the city speciality resolver (see
      // lib/public/specialities.ts's identical comment): a blog must be
      // explicitly associated with the GLOBAL treatment this city
      // treatment links to, AND belong to this same city. No link ->
      // no blogs, never a category/city-only guess.
      treatment.global_treatment_id !== null
        ? getBlogs({
            blog_status: "active",
            city_id: treatment.city_id,
            related_global_treatment_id: treatment.global_treatment_id,
          })
        : Promise.resolve([]),
      treatment.hospital ? getHospitalById(treatment.hospital.id) : null,
      treatment.speciality.doctor_speciality_id
        ? getDoctorsByDoctorSpeciality(treatment.speciality.doctor_speciality_id, treatment.city_id)
        : Promise.resolve([]),
      getTreatments({ speciality_id: treatment.speciality_id, city_id: treatment.city_id, status: "active" }),
      getTreatments({ status: "active" }),
    ]);

  const symptoms: PublicTreatmentSymptom[] = symptomRows.map((symptom) => ({
    id: symptom.id,
    name: symptom.name,
    imageUrl: toLocalImageUrl(symptom.image),
  }));

  const doctors: HomepageDoctor[] = doctorRows.map((doctor) => ({
    id: doctor.id,
    name: doctor.doctor_name,
    qualification: doctor.qualification,
    experience: doctor.experience,
    satisfactionScore: doctor.patient_satisfaction_score != null ? doctor.patient_satisfaction_score.toString() : null,
    imageUrl: toLocalImageUrl(doctor.doctor_image),
    href: getDoctorUrl(doctor.cities.seo_url, doctor.seo_url),
    specialityName: treatment.speciality.speciality_name,
    hospitalName: null,
  }));

  const faqs: PublicTreatmentFaq[] = faqRows.map((faq) => ({ id: faq.id, title: faq.title, text: faq.text }));

  const relatedTreatments: PublicTreatmentRelatedTreatment[] = siblingTreatmentRows
    .filter((row) => row.id !== treatment.id)
    .map((row) => ({
      href: getTreatmentUrl(row.city.seo_url, row.seo_url),
      name: row.sub_speciality_title?.trim() || row.sub_speciality_name,
      description: row.short_description?.trim() || null,
      imageUrl: toLocalImageUrl(row.card_icon),
    }));

  const relatedCities: PublicTreatmentRelatedCity[] = allActiveTreatmentRows
    .filter((row) => row.sub_speciality_name === treatment.sub_speciality_name && row.city.id !== treatment.city_id)
    .map((row) => ({
      citySeoUrl: row.city.seo_url,
      cityName: row.city.city_name,
      href: getTreatmentUrl(row.city.seo_url, row.seo_url),
    }));

  const blogs: HomepageBlog[] = blogRows.map(toTreatmentBlogCard);

  const sectionByType = new Map(sections.map((section) => [section.section_type, section]));

  const highlights: PublicTreatmentLabelValueItem[] =
    (sectionByType.get("highlights")?.content as HighlightsSectionContent | null)?.items ?? [];
  const facts: PublicTreatmentLabelValueItem[] = (sectionByType.get("facts")?.content as FactsSectionContent | null)?.items ?? [];

  const optionsContent = sectionByType.get("options")?.content as OptionsSectionContent | null;
  const options: PublicTreatmentOptions = optionsContent
    ? {
        heading: optionsContent.heading?.trim() || null,
        items: optionsContent.items.map((item) => ({ title: item.title, description: item.description, points: item.points ?? [] })),
      }
    : null;

  const eligibilityContent = sectionByType.get("eligibility")?.content as EligibilitySectionContent | null;
  const eligibility: PublicTreatmentEligibility = eligibilityContent
    ? {
        heading: eligibilityContent.heading?.trim() || null,
        intro: eligibilityContent.intro?.trim() || null,
        indicators: eligibilityContent.indicators ?? [],
        note: eligibilityContent.note?.trim() || null,
      }
    : null;

  const whyChooseUsContent = sectionByType.get("why_choose_us")?.content as WhyChooseUsSectionContent | null;
  const whyChooseUs: PublicTreatmentWhyChooseUs = whyChooseUsContent
    ? {
        heading: whyChooseUsContent.heading?.trim() || null,
        items: whyChooseUsContent.items.map((item) => ({ title: item.title, description: item.description, iconKey: item.icon_key })),
      }
    : null;

  const processContent = sectionByType.get("process")?.content as ProcessSectionContent | null;
  const process: PublicTreatmentProcess = processContent
    ? {
        heading: processContent.heading?.trim() || null,
        items: processContent.items.map((item) => ({ title: item.title, description: item.description })),
      }
    : null;

  const journeyContent = sectionByType.get("journey")?.content as JourneySectionContent | null;
  const journey: PublicTreatmentJourney = journeyContent
    ? {
        heading: journeyContent.heading?.trim() || null,
        steps: journeyContent.steps.map((step) => ({
          duration: step.duration,
          title: step.title,
          iconKey: step.icon,
          points: step.points,
        })),
      }
    : null;

  const preparationRecoveryContent = sectionByType.get("preparation_recovery")?.content as PreparationRecoverySectionContent | null;
  const preparationRecovery: PublicTreatmentPreparationRecoveryGroup[] =
    preparationRecoveryContent?.groups.map((group) => ({
      title: group.title,
      intro: group.intro?.trim() || null,
      items: group.items,
    })) ?? [];

  const ctaSection = sectionByType.get("cta");
  const ctaContent = (ctaSection?.content ?? null) as CtaSectionContent | null;

  const orderedSections: PublicTreatmentSectionItem[] = sections
    .filter((section) => section.status === "active" && section.section_type !== "cta")
    .map((section): PublicTreatmentSectionItem | null => {
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
    .filter((item): item is PublicTreatmentSectionItem => item !== null);

  const detail: PublicTreatmentDetail = {
    id: treatment.id,
    name: treatment.sub_speciality_title?.trim() || treatment.sub_speciality_name,
    seoUrl: treatment.seo_url,
    citySeoUrl: treatment.city.seo_url,
    cityId: treatment.city.id,
    cityName: treatment.city.city_name,
    specialityName: treatment.speciality.speciality_title?.trim() || treatment.speciality.speciality_name,
    specialitySeoUrl: treatment.speciality.seo_url,
    specialityCitySeoUrl: treatment.speciality.cities.seo_url,
    shortDescription: treatment.short_description?.trim() || null,
    descriptionHtml: sanitizeHtmlServer(treatment.description?.trim()) || null,
    imageUrl: toLocalImageUrl(treatment.speciality_logo),
    highlights,
    facts,
    symptoms,
    options,
    eligibility,
    whyChooseUs,
    doctors,
    process,
    journey,
    hospital:
      hospital && hospital.status === "active"
        ? {
            id: hospital.id,
            name: hospital.hospital_name,
            href: getHospitalUrl(hospital.cities.seo_url, hospital.seo_url),
            imageUrl: toHospitalImageUrl(hospital.hospital_image),
            address: hospital.address?.trim() || null,
            cityName: hospital.cities.city_name,
            googleReviews: hospital.google_reviews != null ? hospital.google_reviews.toString() : null,
          }
        : null,
    preparationRecovery,
    faqs,
    relatedTreatments,
    relatedCities,
    blogs,
    sections: orderedSections,
    ctaEnabled: ctaSection?.status === "active",
    cta: {
      heading: ctaContent?.heading?.trim() || null,
      description: ctaContent?.description?.trim() || null,
      items: (ctaContent?.items ?? []).map((item) => ({ title: item.title, description: item.description, iconKey: item.icon_key })),
      buttonText: ctaContent?.button_text?.trim() || null,
      buttonUrl: ctaContent?.button_url?.trim() || null,
    },
    metaTitle: treatment.meta_title?.trim() || null,
    metaDescription: treatment.meta_description?.trim() || null,
  };

  return { status: "ok", detail };
}

export const getCachedPublicTreatment = cache((citySeoUrl: string, treatmentSeoUrl: string) =>
  resolvePublicTreatment(citySeoUrl, treatmentSeoUrl)
);

// --- Treatment Listing (/treatments) -----------------------------------------

const TREATMENT_LISTING_PAGE_SIZE = 12;

export type PublicGlobalListingCard = {
  id: number;
  name: string;
  seoUrl: string;
  href: string;
  shortDescription: string | null;
  imageUrl: string | null;
};

export type PublicTreatmentListing = {
  items: PublicGlobalListingCard[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

/**
 * Nationwide `/treatments` listing — active Global Treatments ONLY
 * (`global_treatments`). Never the city-scoped `treatments` table: same
 * "never derive global content from a city row" rule
 * `lib/public/global-content.ts` enforces for `/dcg/{seoUrl}`.
 */
export async function resolvePublicTreatmentListing(page: number): Promise<PublicTreatmentListing> {
  const { items: rows, total } = await getGlobalTreatmentsPage({ page, pageSize: TREATMENT_LISTING_PAGE_SIZE });

  const items: PublicGlobalListingCard[] = rows.map((row) => {
    // A global treatment's URL is just its own slug now, whatever its speciality link.
    const href = getGlobalTreatmentUrl(row.seo_url);

    return {
      id: row.id,
      name: row.treatment_title?.trim() || row.treatment_name,
      seoUrl: row.seo_url,
      href,
      shortDescription: row.short_description?.trim() || null,
      imageUrl: toLocalImageUrl(row.card_icon),
    };
  });

  return {
    items,
    page,
    pageSize: TREATMENT_LISTING_PAGE_SIZE,
    totalCount: total,
    totalPages: Math.max(1, Math.ceil(total / TREATMENT_LISTING_PAGE_SIZE)),
  };
}

export const getCachedPublicTreatmentListing = cache((page: number) => resolvePublicTreatmentListing(page));

/**
 * `/{citySeoUrl}/treatments` — one city's active treatments (`treatments`
 * rows for that `city_id`, never `global_treatments`), as the same card
 * DTO the nationwide listing uses. Image is the dedicated `card_icon`
 * (never the hero), else the card's default icon.
 */
export async function resolvePublicCityTreatmentCards(cityId: number): Promise<PublicGlobalListingCard[]> {
  const rows = await getTreatments({ status: "active", city_id: cityId });

  return rows.map((row) => ({
    id: row.id,
    name: row.sub_speciality_title?.trim() || row.sub_speciality_name,
    seoUrl: row.seo_url,
    href: getTreatmentUrl(row.city.seo_url, row.seo_url),
    shortDescription: row.short_description?.trim() || null,
    imageUrl: toLocalImageUrl(row.card_icon),
  }));
}
