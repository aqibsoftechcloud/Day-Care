import type { Metadata } from "next";
import { getCachedPublicBlogListing } from "@/lib/public/blogs";
import { getBlogsUrl } from "@/lib/public/urls";
import { buildPublicMetadata } from "@/lib/public/seo";
import { PublicHeader } from "@/components/public/layout/PublicHeader";
import { PublicFooter } from "@/components/public/layout/PublicFooter";
import { BlogListingPage } from "@/components/public/blogs/BlogListingPage";

type BlogsPageProps = {
  searchParams: Promise<{ page?: string }>;
};

/** Parses `?page=`, defaulting to and clamping at 1 — never NaN, never 0/negative. */
function parsePage(raw: string | undefined): number {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

/**
 * `/blogs` — NOT city-prefixed, same "blogs" reserved top-level segment
 * `/blogs/{blogSeoUrl}` (Blog Detail) already occupies. `currentCityId:
 * null` on the header/footer is the same "no city context" convention
 * the nationwide `/` homepage and Blog Detail already use.
 */
export async function generateMetadata({ searchParams }: BlogsPageProps): Promise<Metadata> {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);

  return buildPublicMetadata({
    title: page > 1 ? `Blogs — Page ${page}` : "Blogs",
    description: "Medical insights and health information from Day Care Surgeries.",
    canonicalPath: getBlogsUrl(),
  });
}

export default async function BlogsListingRoute({ searchParams }: BlogsPageProps) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const listing = await getCachedPublicBlogListing(page);

  return (
    <>
      <PublicHeader currentCityId={null} />
      <main>
        <BlogListingPage listing={listing} />
      </main>
      <PublicFooter currentCityId={null} />
    </>
  );
}
