import { cache } from "react";
import { getHospitalBySeoUrl, getHospitalsPage } from "@/services/hospital.service";
import { getActiveHospitalGalleryItems } from "@/services/gallery.service";
import { getSpecialities } from "@/services/speciality.service";
import { getTreatments } from "@/services/treatment.service";
import { getDoctorsByHospital } from "@/services/doctor-mapping.service";
import { getOrCreateHospitalSections } from "@/services/hospital-section.service";
import type { CtaSectionContent, WhyChooseUsSectionContent } from "@/validators/hospital-section.validator";
import { getActiveHospitalInsuranceCompanies } from "@/services/hospital-insurance.service";
import { getTestimonials } from "@/services/testimonial.service";
import { getDoctorUrl, getHospitalUrl, getSpecialityUrl, getTreatmentUrl } from "@/lib/public/urls";
import { toLocalImageUrl, toHospitalImageUrl, stripHtmlToPlainText } from "@/lib/public/homepage";
import type { HomepageHospital } from "@/lib/public/homepage";

/**
 * Public data layer for Hospitals — both the `/{citySeoUrl}/hospitals/{seoUrl}`
 * Detail page and the nationwide `/hospitals` Listing page. Same
 * "call the existing admin service, reshape into a public-safe DTO"
 * convention as every other `lib/public/*.ts` resolver.
 */

// --- Hospital Detail (/{citySeoUrl}/hospitals/{hospitalSeoUrl}) -------------

export type PublicHospitalGalleryImage = {
  id: number;
  imageUrl: string | null;
  name: string;
};

export type PublicHospitalSpeciality = {
  id: number;
  href: string;
  name: string;
  shortDescription: string | null;
};

export type PublicHospitalTreatment = {
  id: number;
  href: string;
  name: string;
  shortDescription: string | null;
  /** The treatment's own `card_icon` (same-origin upload), or null -> the card shows the default treatment icon. */
  iconUrl: string | null;
};

export type PublicHospitalDoctor = {
  id: number;
  name: string;
  qualification: string | null;
  experience: string | null;
  satisfactionScore: string | null;
  imageUrl: string | null;
  href: string;
  specialityName: string | null;
};

export type PublicHospitalWhyChooseUsItem = {
  title: string;
  description: string;
  iconKey: string;
};

export type PublicHospitalWhyChooseUs = {
  heading: string | null;
  items: PublicHospitalWhyChooseUsItem[];
} | null;

export type PublicHospitalCta = {
  heading: string | null;
  description: string | null;
  items: PublicHospitalWhyChooseUsItem[];
  buttonText: string | null;
  buttonUrl: string | null;
  image: string | null;
};

export type PublicHospitalInsurer = {
  id: number;
  name: string;
  logoUrl: string | null;
};

export type PublicHospitalReview = {
  id: number;
  rating: number | null;
  text: string;
  author: string | null;
  city: string;
  date: string | null;
  avatar: string | null;
};

export type PublicHospitalDetail = {
  id: number;
  name: string;
  seoUrl: string;
  citySeoUrl: string;
  cityId: number;
  cityName: string;
  imageUrl: string | null;
  googleReviews: string | null;
  address: string | null;
  phoneNumber: string | null;
  /** `hospitals.timings` (free text, e.g. "24x7") — admin-entered, rendered as-is. */
  timings: string | null;
  /** `hospitals.location_map` — an admin-entered map link; `HospitalHero` prefers this over an address-derived search URL for "Get Directions" when it's a usable URL. */
  locationMap: string | null;
  /** `hospitals.location_360_view` — exposed for a future 360° view UI slot; no public UI currently renders it (see `HospitalHero.tsx`'s doc comment). */
  location360View: string | null;
  /** `hospitals.hospital_description` (plain text). */
  shortDescription: string | null;
  gallery: PublicHospitalGalleryImage[];
  specialities: PublicHospitalSpeciality[];
  treatments: PublicHospitalTreatment[];
  doctors: PublicHospitalDoctor[];
  whyChooseUs: PublicHospitalWhyChooseUs;
  insurers: PublicHospitalInsurer[];
  /** Whether the `cta` fixed `hospital_sections` row is currently active — the page renders no CTA section at all when it is off, rather than an empty one. */
  ctaEnabled: boolean;
  cta: PublicHospitalCta;
  reviews: PublicHospitalReview[];
  metaTitle: string | null;
  metaDescription: string | null;
};

export type HospitalLookupResult =
  | { status: "not-found" }
  | { status: "wrong-city"; canonicalCitySeoUrl: string; canonicalSeoUrl: string }
  | { status: "ok"; detail: PublicHospitalDetail };

/**
 * Full resolve for a Hospital Detail page — every section's real
 * relationship (`specialities.hospital_id`, `treatments.hospital_id`,
 * `doctor_hospitals`, `testimonials.hospital_id`, `hospital_sections`,
 * `gallery.hospital_id`, `hospital_insurance_companies`), never inferred
 * from city. Same not-found/wrong-city/ok precedence as every other
 * city-prefixed detail resolver in this project.
 */
export async function resolvePublicHospital(citySeoUrl: string, hospitalSeoUrl: string): Promise<HospitalLookupResult> {
  const hospital = await getHospitalBySeoUrl(hospitalSeoUrl);

  if (!hospital) {
    return { status: "not-found" };
  }

  if (hospital.cities.seo_url !== citySeoUrl) {
    return { status: "wrong-city", canonicalCitySeoUrl: hospital.cities.seo_url, canonicalSeoUrl: hospital.seo_url };
  }

  const [galleryRows, specialityRows, treatmentRows, doctorRows, sections, insurerRows, reviewRows] = await Promise.all([
    getActiveHospitalGalleryItems(hospital.id),
    getSpecialities({ hospital_id: hospital.id, status: "active" }),
    getTreatments({ hospital_id: hospital.id, status: "active" }),
    getDoctorsByHospital(hospital.id),
    getOrCreateHospitalSections(hospital.id),
    getActiveHospitalInsuranceCompanies(hospital.id),
    getTestimonials({ hospital_id: hospital.id, status: "active" }),
  ]);

  const whyChooseUsSection = sections.find((section) => section.section_type === "why_choose_us");
  const ctaSection = sections.find((section) => section.section_type === "cta");
  const whyChooseUsContent = (whyChooseUsSection?.content ?? null) as WhyChooseUsSectionContent | null;
  const ctaContent = (ctaSection?.content ?? null) as CtaSectionContent | null;

  const whyChooseUs: PublicHospitalWhyChooseUs =
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

  const detail: PublicHospitalDetail = {
    id: hospital.id,
    name: hospital.hospital_name,
    seoUrl: hospital.seo_url,
    citySeoUrl: hospital.cities.seo_url,
    cityId: hospital.cities.id,
    cityName: hospital.cities.city_name,
    imageUrl: toHospitalImageUrl(hospital.hospital_image),
    googleReviews: hospital.google_reviews != null ? hospital.google_reviews.toString() : null,
    address: hospital.address?.trim() || null,
    phoneNumber: hospital.phone_number?.trim() || null,
    timings: hospital.timings?.trim() || null,
    locationMap: hospital.location_map?.trim() || null,
    location360View: hospital.location_360_view?.trim() || null,
    shortDescription: hospital.hospital_description?.trim() || null,
    gallery: galleryRows.map((item) => ({
      id: item.id,
      imageUrl: toHospitalImageUrl(item.source),
      name: item.gallery_name,
    })),
    specialities: specialityRows.map((speciality) => ({
      id: speciality.id,
      href: getSpecialityUrl(speciality.city.seo_url, speciality.seo_url),
      name: speciality.speciality_title?.trim() || speciality.speciality_name,
      shortDescription: speciality.short_description?.trim() || null,
    })),
    // `treatments` rows only (`treatments.hospital_id` = this hospital, active) — never speciality rows. De-duplicated by
    // id so a treatment can't appear twice.
    treatments: Array.from(new Map(treatmentRows.map((treatment) => [treatment.id, treatment])).values()).map((treatment) => ({
      id: treatment.id,
      href: getTreatmentUrl(treatment.city.seo_url, treatment.seo_url),
      name: treatment.sub_speciality_title?.trim() || treatment.sub_speciality_name,
      shortDescription: treatment.short_description?.trim() || null,
      iconUrl: toLocalImageUrl(treatment.card_icon),
    })),
    doctors: doctorRows.map((doctor) => ({
      id: doctor.id,
      name: doctor.doctor_name,
      qualification: doctor.qualification,
      experience: doctor.experience,
      satisfactionScore: doctor.patient_satisfaction_score != null ? doctor.patient_satisfaction_score.toString() : null,
      imageUrl: toLocalImageUrl(doctor.doctor_image),
      href: getDoctorUrl(doctor.cities.seo_url, doctor.seo_url),
      specialityName: doctor.specialityName,
    })),
    whyChooseUs,
    insurers: insurerRows.map((mapping) => ({
      id: mapping.insurance_companies.id,
      name: mapping.insurance_companies.name,
      logoUrl: toHospitalImageUrl(mapping.insurance_companies.logo),
    })),
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
      image: ctaContent?.image ?? null,
    },
    reviews: reviewRows
      .map((review) => ({
        id: review.id,
        rating: null,
        text: review.description ? stripHtmlToPlainText(review.description) : "",
        author: review.testimonial_name?.trim() || null,
        city: review.city.city_name,
        date: review.publish_date ? review.publish_date.toLocaleDateString("en-US", { month: "short", year: "numeric" }) : null,
        avatar: toLocalImageUrl(review.testimonial_image),
      }))
      .filter((review) => review.text.length > 0),
    metaTitle: hospital.meta_title?.trim() || null,
    metaDescription: hospital.meta_description?.trim() || null,
  };

  return { status: "ok", detail };
}

export const getCachedPublicHospital = cache((citySeoUrl: string, hospitalSeoUrl: string) =>
  resolvePublicHospital(citySeoUrl, hospitalSeoUrl)
);

// --- Hospital Listing (/hospitals) -------------------------------------------

const HOSPITAL_LISTING_PAGE_SIZE = 12;

export type PublicHospitalListing = {
  items: HomepageHospital[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

type HospitalCardRow = Awaited<ReturnType<typeof getHospitalsPage>>["items"][number];

function toHospitalCard(hospital: HospitalCardRow): HomepageHospital {
  return {
    id: hospital.id,
    name: hospital.hospital_name,
    href: getHospitalUrl(hospital.cities.seo_url, hospital.seo_url),
    imageUrl: toHospitalImageUrl(hospital.hospital_image),
    address: hospital.address?.trim() || null,
    cityName: hospital.cities.city_name,
    googleReviews: hospital.google_reviews != null ? hospital.google_reviews.toString() : null,
  };
}

/** Upper bound for a CMS "Hospital Listing" section — far above the real hospital count, just a guard against an unbounded query. */
const HOSPITAL_SECTION_MAX = 100;

/**
 * Every active hospital across ALL cities (same `getHospitalsPage` source and card shape as the nationwide
 * `/hospitals` listing) — city-independent by design, used by the CMS "Hospital Listing" page section.
 */
export async function getAllPublicHospitalCards(): Promise<HomepageHospital[]> {
  const { items } = await getHospitalsPage({ page: 1, pageSize: HOSPITAL_SECTION_MAX });
  return items.map(toHospitalCard);
}

/** Nationwide, paginated, active-only hospital listing for `/hospitals` — no city filter. */
export async function resolvePublicHospitalListing(page: number): Promise<PublicHospitalListing> {
  const { items: hospitals, total } = await getHospitalsPage({ page, pageSize: HOSPITAL_LISTING_PAGE_SIZE });

  const items = hospitals.map(toHospitalCard);

  return {
    items,
    page,
    pageSize: HOSPITAL_LISTING_PAGE_SIZE,
    totalCount: total,
    totalPages: Math.max(1, Math.ceil(total / HOSPITAL_LISTING_PAGE_SIZE)),
  };
}

export const getCachedPublicHospitalListing = cache((page: number) => resolvePublicHospitalListing(page));
