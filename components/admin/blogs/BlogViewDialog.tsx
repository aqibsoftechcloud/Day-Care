"use client";

import { DetailSheet } from "@/components/admin/DetailSheet";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format-date";
import { toSafeEditorHtml } from "@/lib/sanitize-html";
import type { Blog } from "@/types/blog";

type BlogViewDialogProps = {
  blog: Blog | null;
  onClose: () => void;
};

export function BlogViewDialog({ blog, onClose }: BlogViewDialogProps) {
  if (!blog) return null;

  return (
    <DetailSheet
      open={!!blog}
      onClose={onClose}
      title="Blog Details"
      description={blog.blog_title}
      sections={[
        {
          heading: "Blog Information",
          rows: [
            { label: "Blog Title", value: blog.blog_title },
            { label: "Category", value: blog.category.category_name },
            { label: "Language", value: blog.language.name },
            { label: "Content Scope", value: blog.city ? "City-Specific Blog" : "Global Blog" },
            { label: "City", value: blog.city ? blog.city.city_name : "— (global)" },
            { label: "Published Date", value: blog.published_date ? formatDate(blog.published_date) : "—" },
            { label: "Search Keywords for Doctors", value: blog.search_keywords_for_doctors || "—" },
            { label: "AI Content Generator", value: blog.ai_content_generator ? "Enabled" : "Disabled" },
            { label: "Featured", value: blog.is_featured ? "Yes" : "No" },
            { label: "Status", value: <StatusBadge status={blog.blog_status} /> },
          ],
        },
        {
          heading: "Author",
          rows: [
            { label: "Author Name", value: blog.author_name || "—" },
            {
              label: "Author Image",
              value: blog.author_image ? (
                // eslint-disable-next-line @next/next/no-img-element -- small preview of the stored uploaded image.
                <img src={blog.author_image} alt="" className="size-12 rounded-full border border-border object-cover" />
              ) : (
                "—"
              ),
            },
          ],
        },
        {
          heading: "Content",
          rows: [
            {
              label: "Image",
              value: blog.blog_image ? (
                // eslint-disable-next-line @next/next/no-img-element -- small preview of the stored uploaded image.
                <img src={blog.blog_image} alt="" className="max-h-16 rounded-md border border-border object-contain" />
              ) : (
                "—"
              ),
            },
            {
              label: "Blog Content",
              value: blog.blog_text ? (
                <div className="rte-content" dangerouslySetInnerHTML={{ __html: toSafeEditorHtml(blog.blog_text) }} />
              ) : (
                "—"
              ),
            },
          ],
        },
        {
          heading: "SEO",
          rows: [
            { label: "SEO URL", value: blog.seo_url },
            { label: "Meta Title", value: blog.meta_title || "—" },
            { label: "Meta Description", value: blog.meta_description || "—" },
            { label: "Meta Keywords", value: blog.meta_keywords || "—" },
          ],
        },
        {
          heading: "Timestamps",
          rows: [
            { label: "Created", value: formatDate(blog.created_at) },
            { label: "Updated", value: formatDate(blog.updated_at) },
          ],
        },
      ]}
    />
  );
}
