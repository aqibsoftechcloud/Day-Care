"use client";

import { DetailSheet } from "@/components/admin/DetailSheet";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format-date";
import type { Language } from "@/types/language";

type LanguageViewDialogProps = {
  language: Language | null;
  onClose: () => void;
};

export function LanguageViewDialog({ language, onClose }: LanguageViewDialogProps) {
  if (!language) return null;

  return (
    <DetailSheet
      open={!!language}
      onClose={onClose}
      title="Language Details"
      description={language.name}
      sections={[
        {
          heading: "Language Information",
          rows: [
            { label: "Name", value: language.name },
            { label: "SEO URL", value: language.seo_url },
            { label: "Status", value: <StatusBadge status={language.status} /> },
          ],
        },
        {
          heading: "Timestamps",
          rows: [
            { label: "Created", value: formatDate(language.created_at) },
            { label: "Updated", value: formatDate(language.updated_at) },
          ],
        },
      ]}
    />
  );
}
