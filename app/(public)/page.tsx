import { PublicHeader } from "@/components/public/layout/PublicHeader";
import { PublicFooter } from "@/components/public/layout/PublicFooter";
import { HeroBanner } from "@/components/public/home/HeroBanner";
import { TrustStatsSection } from "@/components/public/home/TrustStatsSection";
import { SpecializedCareSection } from "@/components/public/home/SpecializedCareSection";
import { HospitalsSection } from "@/components/public/home/HospitalsSection";
import { DoctorsSection } from "@/components/public/home/DoctorsSection";
import { WhyChooseDcsSection } from "@/components/public/home/WhyChooseDcsSection";
import { ReviewsSection } from "@/components/public/home/ReviewsSection";
import { BlogsSection } from "@/components/public/home/BlogsSection";
import { HomepageConsultationSection } from "@/components/public/home/HomepageConsultationSection";
import { OurLocationsSection } from "@/components/public/home/OurLocationsSection";
import { FAQSection } from "@/components/public/home/FAQSection";

// Every other public route is already dynamic; without this the homepage —
// and the navbar it renders — was prerendered at build time, so CMS changes
// (e.g. a new global treatment) would not show until the next rebuild.
export const dynamic = "force-dynamic";

/**
 * Nationwide homepage. No city context here (`currentCityId: null`), so
 * the header's city selector shows its neutral "Select City" state and
 * the Hero shows the highest-priority active banner across all cities
 * (see `lib/public/banners.ts`'s documented "no city context filters
 * nothing" convention) rather than guessing a default city.
 */
export default function HomePageRoute() {
  return (
    <>
      <PublicHeader currentCityId={null} />
      <main>
        <HeroBanner currentCityId={null} cityName={null} transparentOverHero={false} />
        <TrustStatsSection currentCityId={null} />
        <SpecializedCareSection currentCityId={null} />
        <HospitalsSection currentCityId={null} cityName={null} citySeoUrl={null} />
        <DoctorsSection currentCityId={null} />
        <WhyChooseDcsSection currentCityId={null} />
        <ReviewsSection />
        <BlogsSection currentCityId={null} />
        <HomepageConsultationSection />
        <OurLocationsSection />
        <FAQSection />
      </main>
      <PublicFooter currentCityId={null} />
    </>
  );
}
