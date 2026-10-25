import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCachedRootSlugResolution } from "@/lib/public/root-resolver";
import { getGenericPageUrl } from "@/lib/public/urls";
import { buildPublicMetadata } from "@/lib/public/seo";
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
import { GenericPageBody } from "@/components/public/pages/GenericPageBody";
import { PublicBreadcrumb } from "@/components/public/shared/PublicBreadcrumb";

type RootSlugPageProps = { params: Promise<{ rootSlug: string }> };

/**
 * Only the generic-Page branch gets real metadata here — the city
 * branch had none before this change and still has none now (returning
 * `{}` preserves that exactly), since building city-page SEO is a
 * separate, unrelated concern outside this fix's scope.
 */
export async function generateMetadata({ params }: RootSlugPageProps): Promise<Metadata> {
  const { rootSlug } = await params;
  const resolution = await getCachedRootSlugResolution(rootSlug);

  if (!resolution || resolution.type !== "page") {
    return {};
  }

  const page = resolution.data;

  return buildPublicMetadata({
    title: page.meta_title?.trim() || page.title,
    description: page.meta_description?.trim() || undefined,
    canonicalPath: getGenericPageUrl(page.seo_url),
  });
}

export default async function RootSlugPageRoute({ params }: RootSlugPageProps) {
  const { rootSlug } = await params;
  const resolution = await getCachedRootSlugResolution(rootSlug);

  if (!resolution) {
    notFound();
  }

  // Resolve currentCityId based on whether resolution is a city or a city-linked page
  const isCity = resolution.type === "city";
  const currentCityId = isCity
    ? resolution.data.id
    : resolution.data.city_id ?? null;

  return (
    <>
      {/* Solid, sticky navbar from first paint on city homepages too (same as every other page) - no transparent/glass-over-hero state. */}
      <PublicHeader currentCityId={currentCityId} />
      <main>
        {isCity ? (
          <>
            <HeroBanner
              currentCityId={resolution.data.id}
              cityName={resolution.data.city_name}
              transparentOverHero={false}
            />
            <TrustStatsSection currentCityId={resolution.data.id} />
            <SpecializedCareSection currentCityId={resolution.data.id} />
            <HospitalsSection
              currentCityId={resolution.data.id}
              cityName={resolution.data.city_name}
              citySeoUrl={resolution.data.seo_url}
            />
            <DoctorsSection currentCityId={resolution.data.id} />
            <WhyChooseDcsSection currentCityId={resolution.data.id} />
            <ReviewsSection />
            <BlogsSection currentCityId={resolution.data.id} />
            <HomepageConsultationSection />
            <OurLocationsSection />
            <FAQSection />
          </>
        ) : (
          <>
            <PublicBreadcrumb
              className="public-container pt-4 pb-1"
              items={[{ label: "Home", href: "/" }, { label: resolution.data.title }]}
            />
            <GenericPageBody page={resolution.data} />
          </>
        )}
      </main>
      <PublicFooter currentCityId={currentCityId} />
    </>
  );
}