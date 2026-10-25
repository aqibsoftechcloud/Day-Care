import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCachedPublicGlobalSpeciality } from "@/lib/public/global-content";
import { buildPublicMetadata } from "@/lib/public/seo";
import { PublicHeader } from "@/components/public/layout/PublicHeader";
import { PublicFooter } from "@/components/public/layout/PublicFooter";
import { GlobalDetailPage } from "@/components/public/global/GlobalDetailPage";

type Props = {
  params: Promise<{ seoUrl: string }>;
};

/**
 * `/dcg/speciality/{seoUrl}` — a Global Speciality detail page.
 * City-independent ("Daycare Global"), reusing the one `GlobalDetailPage`
 * template and the shared detail builders in `lib/public/global-content.ts`.
 * `"dcg"` is a reserved top-level segment (see `lib/public/reserved-slugs.ts`).
 * The canonical URL comes from `detail.href` (the URL helper), so metadata,
 * breadcrumbs and cards can never disagree about it.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seoUrl } = await params;
  const result = await getCachedPublicGlobalSpeciality(seoUrl);

  if (result.status !== "ok") {
    return {};
  }

  const { detail } = result;

  return buildPublicMetadata({
    title: detail.metaTitle?.trim() || detail.name,
    description: detail.metaDescription?.trim() || detail.shortDescription || undefined,
    canonicalPath: detail.href,
    imageUrl: detail.imageUrl ?? undefined,
  });
}

export default async function GlobalSpecialityRoute({ params }: Props) {
  const { seoUrl } = await params;
  const result = await getCachedPublicGlobalSpeciality(seoUrl);

  if (result.status === "not-found") {
    notFound();
  }

  return (
    <>
      <PublicHeader currentCityId={null} />
      <main>
        <GlobalDetailPage detail={result.detail} />
      </main>
      <PublicFooter currentCityId={null} />
    </>
  );
}
