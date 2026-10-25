"use client";

import { DetailSheet } from "@/components/admin/DetailSheet";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format-date";
import { toSafeEditorHtml } from "@/lib/sanitize-html";
import type { Page } from "@/types/page";

type PageViewDialogProps = {
  page: Page | null;
  onClose: () => void;
};

export function PageViewDialog({ page, onClose }: PageViewDialogProps) {
  if (!page) return null;

  // Body is rendered from the same Tiptap-produced HTML stored via the
  // editor (legacy plain-text rows are upgraded to equivalent HTML) — safe
  // here because it was authored through the schema-constrained editor by
  // a permissioned admin user, the same trust boundary the plain-text
  // rendering already relied on.

  return (
    <DetailSheet
      open={!!page}
      onClose={onClose}
      title="Page Details"
      description={page.title}
      sections={[
        {
          heading: "Page Information",
          rows: [
            { label: "Title", value: page.title },
            { label: "Category", value: page.category },
            { label: "Language", value: page.language.name },
            { label: "Page Type", value: page.city ? "City-Specific Page" : "Global Page" },
            { label: "City", value: page.city ? page.city.city_name : "— (global)" },
            { label: "Location", value: page.location ? page.location.area : "—" },
            { label: "Status", value: <StatusBadge status={page.status} /> },
            {
              label: "Body",
              value: page.body ? (
                <div className="rte-content" dangerouslySetInnerHTML={{ __html: toSafeEditorHtml(page.body) }} />
              ) : (
                "—"
              ),
            },
          ],
        },
        {
          heading: "SEO",
          rows: [
            { label: "SEO URL", value: page.seo_url },
            { label: "Meta Title", value: page.meta_title || "—" },
            { label: "Meta Description", value: page.meta_description || "—" },
            { label: "Meta Keyword", value: page.meta_keyword || "—" },
          ],
        },
        {
          heading: "Timestamps",
          rows: [
            { label: "Created", value: formatDate(page.created_at) },
            { label: "Updated", value: formatDate(page.updated_at) },
          ],
        },
      ]}
    />
  );
}
