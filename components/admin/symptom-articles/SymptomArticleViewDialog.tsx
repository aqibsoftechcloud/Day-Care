"use client";

import { DetailSheet } from "@/components/admin/DetailSheet";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format-date";
import { toSafeEditorHtml } from "@/lib/sanitize-html";
import type { SymptomArticle } from "@/types/symptom-article";

type SymptomArticleViewDialogProps = {
  article: SymptomArticle | null;
  onClose: () => void;
};

export function SymptomArticleViewDialog({ article, onClose }: SymptomArticleViewDialogProps) {
  if (!article) return null;

  return (
    <DetailSheet
      open={!!article}
      onClose={onClose}
      title="Article Details"
      description={article.article_name}
      sections={[
        {
          heading: "Article Information",
          rows: [
            { label: "Article Name", value: article.article_name },
            { label: "Part", value: article.part.part_name },
            { label: "Symptom", value: article.symptom.symptom_name },
            { label: "Status", value: <StatusBadge status={article.status} /> },
          ],
        },
        {
          heading: "Content",
          rows: [
            {
              label: "Description",
              value: article.description ? (
                <div className="rte-content" dangerouslySetInnerHTML={{ __html: toSafeEditorHtml(article.description) }} />
              ) : (
                "—"
              ),
            },
          ],
        },
        {
          heading: "SEO",
          rows: [
            { label: "SEO URL", value: article.seo_url },
            { label: "Meta Title", value: article.meta_title || "—" },
            { label: "Meta Description", value: article.meta_description || "—" },
            { label: "Meta Keywords", value: article.meta_keywords || "—" },
          ],
        },
        {
          heading: "Timestamps",
          rows: [
            { label: "Created", value: formatDate(article.created_at) },
            { label: "Updated", value: formatDate(article.updated_at) },
          ],
        },
      ]}
    />
  );
}
