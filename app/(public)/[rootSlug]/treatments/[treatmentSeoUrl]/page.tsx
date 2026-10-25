import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getCachedPublicTreatment } from "@/lib/public/treatments";
import { getTreatmentUrl } from "@/lib/public/urls";
import { buildPublicMetadata } from "@/lib/public/seo";
import { PublicHeader } from "@/components/public/layout/PublicHeader";
import { PublicFooter } from "@/components/public/layout/PublicFooter";
import { TreatmentDetailPage } from "@/components/public/treatments/TreatmentDetailPage";

type TreatmentPageProps = {
  params: Promise<{ rootSlug: string; treatmentSeoUrl: string }>;
};

/**
 * `/{citySeoUrl}/treatments/{treatmentSeoUrl}` — this route did not exist
 * before (confirmed: `getTreatmentUrl` links across the site, including
 * the new Speciality Treatments section, previously pointed at a 404).
 * Mirrors the Speciality detail route's exact structure/precedence rules
 * — see that file's own doc comment — reusing the already-fully-built
 * `resolvePublicTreatment()` resolver rather than adding new data-fetching.
 */
export async function generateMetadata({ params }: TreatmentPageProps): Promise<Metadata> {
  const { rootSlug, treatmentSeoUrl } = await params;
  const result = await getCachedPublicTreatment(rootSlug, treatmentSeoUrl);

  if (result.status !== "ok") {
    return {};
  }

  const { detail } = result;

  return buildPublicMetadata({
    title: detail.metaTitle?.trim() || detail.name,
    description: detail.metaDescription?.trim() || detail.shortDescription || undefined,
    canonicalPath: getTreatmentUrl(detail.citySeoUrl, treatmentSeoUrl),
    imageUrl: detail.imageUrl ?? undefined,
  });
}

export default async function TreatmentDetailRoute({ params }: TreatmentPageProps) {
  const { rootSlug, treatmentSeoUrl } = await params;
  const result = await getCachedPublicTreatment(rootSlug, treatmentSeoUrl);

  if (result.status === "not-found") {
    notFound();
  }

  if (result.status === "wrong-city") {
    permanentRedirect(getTreatmentUrl(result.canonicalCitySeoUrl, result.canonicalSeoUrl));
  }

  const { detail } = result;

  return (
    <>
      <PublicHeader currentCityId={detail.cityId} />
      <main>
        <TreatmentDetailPage detail={detail} />
      </main>
      <PublicFooter currentCityId={detail.cityId} />
    </>
  );
}
