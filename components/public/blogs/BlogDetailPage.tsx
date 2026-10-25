import type { PublicBlogDetail } from "@/lib/public/blogs";
import { BlogHero } from "./BlogHero";
import { BlogContent } from "./BlogContent";
import { BlogFaqs } from "./BlogFaqs";
import { BlogRelated } from "./BlogRelated";

type BlogDetailPageProps = {
  detail: PublicBlogDetail;
};

/**
 * Blog Detail Page template. 100% CMS/database-driven: every section
 * reads from the real `PublicBlogDetail` resolver output
 * (lib/public/blogs.ts) — `blogs` core fields, `blog_categories`,
 * `blog_faqs`, and other active blogs in the same category for
 * "Related Articles". No hardcoded blog content anywhere in this
 * component tree.
 *
 * `BlogContent` is skipped entirely when `blog_text` is empty — never a
 * blank article shell.
 */
export function BlogDetailPage({ detail }: BlogDetailPageProps) {
  return (
    <>
      <BlogHero detail={detail} />
      {detail.html && <BlogContent html={detail.html} />}
      <BlogFaqs faqs={detail.faqs} />
      <BlogRelated blogs={detail.relatedBlogs} />
    </>
  );
}
