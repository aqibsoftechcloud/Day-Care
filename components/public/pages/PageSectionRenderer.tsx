import type { PublicPageSection } from "@/lib/public/page-sections";
import { PageHeroSection } from "./PageHeroSection";
import { PageAboutSection } from "./PageAboutSection";
import { PageFeaturesSection } from "./PageFeaturesSection";
import { PageContentSection } from "./PageContentSection";
import { PageCtaSection } from "./PageCtaSection";
import { PageHospitalListingSection } from "./PageHospitalListingSection";

/**
 * Dispatches one section to its matching component by `section.type` —
 * the database's `section_order` (already applied by the caller's
 * `.map`) controls what appears where, never a hardcoded order here.
 */
export function PageSectionRenderer({ section }: { section: PublicPageSection }) {
  switch (section.type) {
    case "hero":
      return <PageHeroSection section={section} />;
    case "about":
      return <PageAboutSection section={section} />;
    case "features":
      return <PageFeaturesSection section={section} />;
    case "content":
      return <PageContentSection section={section} />;
    case "cta":
      return <PageCtaSection section={section} />;
    case "hospital_listing":
      return <PageHospitalListingSection section={section} />;
  }
}
