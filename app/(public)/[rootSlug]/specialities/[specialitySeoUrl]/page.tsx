import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getCachedPublicSpeciality } from "@/lib/public/specialities";
import { getSpecialityUrl } from "@/lib/public/urls";
import { buildPublicMetadata } from "@/lib/public/seo";
import { PublicHeader } from "@/components/public/layout/PublicHeader";
import { PublicFooter } from "@/components/public/layout/PublicFooter";
import { SpecialityDetailPage } from "@/components/public/specialities/SpecialityDetailPage";

type SpecialityPageProps = {
  params: Promise<{ rootSlug: string; specialitySeoUrl: string }>;
};

/**
 * `/{citySeoUrl}/specialities/{specialitySeoUrl}` — a sibling route next
 * to `[rootSlug]/page.tsx` (which only matches the single-segment
 * `/{rootSlug}` exactly), so this doesn't touch or conflict with that
 * file. `rootSlug` here is always the city segment for this URL shape,
 * per the locked public URL architecture in lib/public/urls.ts.
 *
 * `getCachedPublicSpeciality` does the real city-validation/lookup work
 * (see lib/public/specialities.ts's `resolvePublicSpeciality`), reusing
 * `getCityBySeoUrl` the same way `resolveRootSlug` does — this route
 * doesn't reimplement that resolution itself.
 */
export async function generateMetadata({ params }: SpecialityPageProps): Promise<Metadata> {
  const { rootSlug, specialitySeoUrl } = await params;
  const result = await getCachedPublicSpeciality(rootSlug, specialitySeoUrl);

  if (result.status !== "ok") {
    // notFound()/permanentRedirect() in the page component itself handles
    // these cases — metadata just needs to not crash while that happens.
    return {};
  }

  const { detail } = result;

  return buildPublicMetadata({
    title: detail.metaTitle?.trim() || detail.name,
    description: detail.metaDescription?.trim() || detail.shortDescription || undefined,
    canonicalPath: getSpecialityUrl(detail.citySeoUrl, specialitySeoUrl),
    imageUrl: detail.imageUrl ?? undefined,
    keywords: detail.metaKeyword
      ? detail.metaKeyword.split(",").map((keyword) => keyword.trim()).filter(Boolean)
      : undefined,
  });
}

export default async function SpecialityDetailRoute({ params }: SpecialityPageProps) {
  const { rootSlug, specialitySeoUrl } = await params;
  const result = await getCachedPublicSpeciality(rootSlug, specialitySeoUrl);

  if (result.status === "not-found") {
    notFound();
  }

  if (result.status === "wrong-city") {
    permanentRedirect(getSpecialityUrl(result.canonicalCitySeoUrl, result.canonicalSeoUrl));
  }

  const { detail } = result;

  return (
    <>
      <PublicHeader currentCityId={detail.cityId} />
      <main>
        <SpecialityDetailPage detail={detail} />
      </main>
      <PublicFooter currentCityId={detail.cityId} />
    </>
  );
}
