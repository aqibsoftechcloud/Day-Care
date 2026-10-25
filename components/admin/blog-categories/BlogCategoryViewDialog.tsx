"use client";

import { DetailSheet } from "@/components/admin/DetailSheet";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format-date";
import type { BlogCategory } from "@/types/blog-category";

type BlogCategoryViewDialogProps = {
  blogCategory: BlogCategory | null;
  onClose: () => void;
};

export function BlogCategoryViewDialog({ blogCategory, onClose }: BlogCategoryViewDialogProps) {
  if (!blogCategory) return null;

  return (
    <DetailSheet
      open={!!blogCategory}
      onClose={onClose}
      title="Blog Category Details"
      description={blogCategory.category_name}
      sections={[
        {
          heading: "Blog Category Information",
          rows: [
            { label: "Category Name", value: blogCategory.category_name },
            { label: "Status", value: <StatusBadge status={blogCategory.status} /> },
          ],
        },
        {
          heading: "SEO",
          rows: [
            { label: "SEO URL", value: blogCategory.seo_url },
            { label: "Meta Title", value: blogCategory.meta_title || "—" },
            { label: "Meta Description", value: blogCategory.meta_description || "—" },
            { label: "Meta Keywords", value: blogCategory.meta_keywords || "—" },
          ],
        },
        {
          heading: "Timestamps",
          rows: [
            { label: "Created", value: formatDate(blogCategory.created_at) },
            { label: "Updated", value: formatDate(blogCategory.updated_at) },
          ],
        },
      ]}
    />
  );
}
