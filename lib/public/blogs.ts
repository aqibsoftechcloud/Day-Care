import { cache } from "react";
import { getBlogBySeoUrl, getBlogs, getBlogsPage, getFeaturedBlog } from "@/services/blog.service";
import { getBlogFaqs } from "@/services/blog-faq.service";
import { getBlogUrl } from "@/lib/public/urls";
import { toLocalImageUrl } from "@/lib/public/homepage";
import type { HomepageBlog } from "@/lib/public/homepage";

/** The actual shape `blog.service.ts`'s `toSafeBlog()` returns — real `Date` objects (not yet JSON-serialized), unlike `types/blog.ts`'s admin-API `Blog` type. */
type BlogServiceRow = Awaited<ReturnType<typeof getBlogs>>[number];

/**
 * Public data layer for the Blog Detail page — mirrors every other
 * `lib/public/*.ts` resolver's own convention: calls the existing admin
 * `blog.service.ts`/`blog-faq.service.ts` functions (never Prisma
 * directly, never the RBAC-gated admin API routes), and reshapes the
 * result into a small, public-safe DTO. No fabricated/fallback content —
 * an unconfigured field is `null`, and the component decides what (if
 * anything generic) to render in its place.
 *
 * Unlike Hospital/Treatment/Speciality/Doctor, the Blog Detail URL is
 * NOT city-prefixed (`/blogs/{seoUrl}`, confirmed reserved as a top-level
 * segment in `lib/public/reserved-slugs.ts`) — so there is no
 * "wrong-city" lookup state here, only "not-found" vs "ok".
 */

export type PublicBlogFaq = {
  id: number;
  title: string;
  text: string;
};

export type PublicBlogDetail = {
  id: number;
  title: string;
  seoUrl: string;
  href: string;
  imageUrl: string | null;
  authorName: string | null;
  authorImageUrl: string | null;
  isFeatured: boolean;
  publishedDate: Date | null;
  /** Raw Tiptap-produced HTML, unmodified — rendered via the existing `.rte-content` convention. */
  html: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  category: {
    name: string;
    seoUrl: string;
  };
  /** Only active FAQs for this blog, in their configured order. */
  faqs: PublicBlogFaq[];
  /** Other active blogs sharing this blog's category — `blogs` has no other relation to key off (see the Blog audit). Same `HomepageBlog` shape `BlogCard` already renders, so it's reused directly rather than duplicated. */
  relatedBlogs: HomepageBlog[];
};

export type BlogLookupResult =
  | { status: "not-found" }
  | { status: "ok"; detail: PublicBlogDetail };

const RELATED_BLOGS_LIMIT = 3;

/** Shared `blog.service.ts` row -> public card DTO mapping, reused by Related Blogs (Detail page) and the Listing page's featured/grid cards — one shape, one place it's built. */
function toHomepageBlogCard(row: BlogServiceRow): HomepageBlog {
  return {
    id: row.id,
    title: row.blog_title,
    excerpt: row.meta_description?.trim() || null,
    imageUrl: toLocalImageUrl(row.blog_image),
    publishedDate: row.published_date,
    href: getBlogUrl(row.seo_url),
    categoryName: row.category?.category_name ?? null,
    authorName: row.author_name?.trim() || null,
    authorImageUrl: toLocalImageUrl(row.author_image),
  };
}

/**
 * Full resolve for `/blogs/{blogSeoUrl}` — `getBlogBySeoUrl` is already
 * active-only (`blog_status: "active"`), so a lookup that returns nothing
 * is unambiguously "not found" (inactive, or never existed — same
 * "never reveal which" precedent every other public resolver follows).
 */
export async function resolvePublicBlog(blogSeoUrl: string): Promise<BlogLookupResult> {
  const blog = await getBlogBySeoUrl(blogSeoUrl);

  if (!blog) {
    return { status: "not-found" };
  }

  const [faqRows, categoryBlogRows] = await Promise.all([
    getBlogFaqs({ blog_id: blog.id }),
    getBlogs({ blog_category_id: blog.blog_category_id, blog_status: "active" }),
  ]);

  const faqs: PublicBlogFaq[] = faqRows
    // `getBlogFaqs` has no `status` filter param (same gap `getHospitalFaqs` has) — filtered here instead.
    .filter((faq) => faq.status === "active")
    .map((faq) => ({ id: faq.id, title: faq.title, text: faq.text }));

  const relatedBlogs: HomepageBlog[] = categoryBlogRows
    .filter((row) => row.id !== blog.id)
    .slice(0, RELATED_BLOGS_LIMIT)
    .map(toHomepageBlogCard);

  const detail: PublicBlogDetail = {
    id: blog.id,
    title: blog.blog_title,
    seoUrl: blog.seo_url,
    href: getBlogUrl(blog.seo_url),
    imageUrl: toLocalImageUrl(blog.blog_image),
    authorName: blog.author_name?.trim() || null,
    authorImageUrl: toLocalImageUrl(blog.author_image),
    isFeatured: blog.is_featured,
    publishedDate: blog.published_date,
    html: blog.blog_text?.trim() || null,
    metaTitle: blog.meta_title?.trim() || null,
    metaDescription: blog.meta_description?.trim() || null,
    category: {
      name: blog.category.category_name,
      seoUrl: blog.category.seo_url,
    },
    faqs,
    relatedBlogs,
  };

  return { status: "ok", detail };
}

export const getCachedPublicBlog = cache((blogSeoUrl: string) => resolvePublicBlog(blogSeoUrl));

// --- Blog Listing (/blogs) ---------------------------------------------------

const BLOG_LISTING_PAGE_SIZE = 12;

export type PublicBlogListing = {
  /** The single active `is_featured` blog, or `null` when none is marked — never a fabricated stand-in (see `getFeaturedBlog`). Rendered in its own large card, separately from `items` below. */
  featured: HomepageBlog | null;
  /** The regular grid — active blogs, newest first, excluding `featured` (when one exists) so it's never shown twice. */
  items: HomepageBlog[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

/**
 * Full resolve for `/blogs` (optionally `?page=N`). `page` is clamped to
 * at least 1 by the caller (the route) before this runs — this function
 * itself does not guess at an invalid page's "nearest valid" value, it
 * just queries exactly the page asked for (an out-of-range page simply
 * returns an empty `items` array, same as any other out-of-range offset
 * query — never a redirect/404, since an empty Listing page is not an
 * error state the way a missing Blog Detail is).
 */
export async function resolvePublicBlogListing(page: number): Promise<PublicBlogListing> {
  const featuredRow = await getFeaturedBlog();
  const featured = featuredRow ? toHomepageBlogCard(featuredRow) : null;

  const { items: rows, total } = await getBlogsPage({
    page,
    pageSize: BLOG_LISTING_PAGE_SIZE,
    excludeId: featuredRow?.id,
  });

  return {
    featured,
    items: rows.map(toHomepageBlogCard),
    page,
    pageSize: BLOG_LISTING_PAGE_SIZE,
    totalCount: total,
    totalPages: Math.max(1, Math.ceil(total / BLOG_LISTING_PAGE_SIZE)),
  };
}

export const getCachedPublicBlogListing = cache((page: number) => resolvePublicBlogListing(page));
