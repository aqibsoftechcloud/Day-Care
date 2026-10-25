import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCachedPublicBlog } from "@/lib/public/blogs";
import { getBlogUrl } from "@/lib/public/urls";
import { buildPublicMetadata } from "@/lib/public/seo";
import { PublicHeader } from "@/components/public/layout/PublicHeader";
import { PublicFooter } from "@/components/public/layout/PublicFooter";
import { BlogDetailPage } from "@/components/public/blogs/BlogDetailPage";

type BlogPageProps = {
  params: Promise<{ blogSeoUrl: string }>;
};

/**
 * `/blogs/{blogSeoUrl}` — NOT city-prefixed, unlike Hospital/Treatment/
 * Speciality/Doctor. `"blogs"` is already reserved as a top-level public
 * route segment (see `lib/public/reserved-slugs.ts`); this is the first
 * route to actually occupy it. `currentCityId={null}` on the header/
 * footer is the same "no city context" convention the nationwide `/`
 * homepage route already uses.
 */
export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { blogSeoUrl } = await params;
  const result = await getCachedPublicBlog(blogSeoUrl);

  if (result.status !== "ok") {
    return {};
  }

  const { detail } = result;

  return buildPublicMetadata({
    title: detail.metaTitle?.trim() || detail.title,
    description: detail.metaDescription?.trim() || undefined,
    canonicalPath: getBlogUrl(detail.seoUrl),
    imageUrl: detail.imageUrl ?? undefined,
  });
}

export default async function BlogDetailRoute({ params }: BlogPageProps) {
  const { blogSeoUrl } = await params;
  const result = await getCachedPublicBlog(blogSeoUrl);

  if (result.status === "not-found") {
    notFound();
  }

  const { detail } = result;

  return (
    <>
      <PublicHeader currentCityId={null} />
      <main>
        <BlogDetailPage detail={detail} />
      </main>
      <PublicFooter currentCityId={null} />
    </>
  );
}
