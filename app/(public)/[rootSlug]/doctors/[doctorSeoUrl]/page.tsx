import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getCachedPublicDoctor } from "@/lib/public/doctors";
import { getDoctorUrl } from "@/lib/public/urls";
import { buildPublicMetadata } from "@/lib/public/seo";
import { PublicHeader } from "@/components/public/layout/PublicHeader";
import { PublicFooter } from "@/components/public/layout/PublicFooter";
import { DoctorDetailPage } from "@/components/public/doctors/DoctorDetailPage";

type DoctorPageProps = {
  params: Promise<{ rootSlug: string; doctorSeoUrl: string }>;
};

/**
 * `/{citySeoUrl}/doctors/{doctorSeoUrl}` — did not exist before (confirmed:
 * `getDoctorUrl()` was already used by the homepage carousel and the
 * Treatment/Speciality/Hospital Doctors sections, all linking at a route
 * that 404'd). Resolved against the real `doctors` table via
 * `resolvePublicDoctor` (lib/public/doctors.ts), mirroring
 * `resolvePublicHospital`/`resolvePublicTreatment`'s exact
 * not-found/wrong-city/ok precedence.
 */
export async function generateMetadata({ params }: DoctorPageProps): Promise<Metadata> {
  const { rootSlug, doctorSeoUrl } = await params;
  const result = await getCachedPublicDoctor(rootSlug, doctorSeoUrl);

  if (result.status !== "ok") {
    return {};
  }

  const { detail } = result;

  return buildPublicMetadata({
    title: detail.metaTitle || detail.name,
    description: detail.metaDescription || undefined,
    canonicalPath: getDoctorUrl(detail.citySeoUrl, detail.seoUrl),
    imageUrl: detail.imageUrl ?? undefined,
  });
}

export default async function DoctorDetailRoute({ params }: DoctorPageProps) {
  const { rootSlug, doctorSeoUrl } = await params;
  const result = await getCachedPublicDoctor(rootSlug, doctorSeoUrl);

  if (result.status === "not-found") {
    notFound();
  }

  if (result.status === "wrong-city") {
    permanentRedirect(getDoctorUrl(result.canonicalCitySeoUrl, result.canonicalSeoUrl));
  }

  const { detail } = result;

  return (
    <>
      <PublicHeader currentCityId={detail.cityId} />
      <main>
        <DoctorDetailPage detail={detail} />
      </main>
      <PublicFooter currentCityId={detail.cityId} compact />
    </>
  );
}
