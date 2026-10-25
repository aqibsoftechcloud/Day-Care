import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getCachedPublicHospital } from "@/lib/public/hospitals";
import { getHospitalUrl } from "@/lib/public/urls";
import { buildPublicMetadata } from "@/lib/public/seo";
import { PublicHeader } from "@/components/public/layout/PublicHeader";
import { PublicFooter } from "@/components/public/layout/PublicFooter";
import { HospitalDetailPage } from "@/components/public/hospitals/HospitalDetailPage";

type HospitalPageProps = {
  params: Promise<{ rootSlug: string; hospitalSeoUrl: string }>;
};

/**
 * `/{citySeoUrl}/hospitals/{hospitalSeoUrl}` — fully resolved against the
 * real `hospitals` table and every one of its real relationships via
 * `resolvePublicHospital` (lib/public/hospitals.ts), mirroring
 * `resolvePublicTreatment`'s exact not-found/wrong-city/ok precedence.
 * No mock content anywhere in this route or the component tree it
 * renders — see `resolvePublicHospital`'s own doc comment for the full
 * relationship map.
 */
export async function generateMetadata({ params }: HospitalPageProps): Promise<Metadata> {
  const { rootSlug, hospitalSeoUrl } = await params;
  const result = await getCachedPublicHospital(rootSlug, hospitalSeoUrl);

  if (result.status !== "ok") {
    return {};
  }

  const { detail } = result;

  return buildPublicMetadata({
    title: detail.metaTitle || detail.name,
    description: detail.metaDescription || detail.shortDescription || undefined,
    canonicalPath: getHospitalUrl(detail.citySeoUrl, detail.seoUrl),
    imageUrl: detail.imageUrl ?? undefined,
  });
}

export default async function HospitalDetailRoute({ params }: HospitalPageProps) {
  const { rootSlug, hospitalSeoUrl } = await params;
  const result = await getCachedPublicHospital(rootSlug, hospitalSeoUrl);

  if (result.status === "not-found") {
    notFound();
  }

  if (result.status === "wrong-city") {
    permanentRedirect(getHospitalUrl(result.canonicalCitySeoUrl, result.canonicalSeoUrl));
  }

  const { detail } = result;

  return (
    <>
      <PublicHeader currentCityId={detail.cityId} />
      <main>
        <HospitalDetailPage detail={detail} />
      </main>
      {/* `showAppointmentBanner={false}`: the footer's own banner is fixed, hardcoded copy ("Book an Appointment") — this page must be fully CMS-driven with no hardcoded appointment content. The real, CMS-driven CTA is `HospitalConsultCta` above, inside `HospitalDetailPage`. No other public route passes this prop, so every other page's footer is unchanged. */}
      <PublicFooter currentCityId={detail.cityId} showAppointmentBanner={false} />
    </>
  );
}
