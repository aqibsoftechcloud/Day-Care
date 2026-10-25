"use client";

import { DetailSheet } from "@/components/admin/DetailSheet";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format-date";
import type { GeneralFaq } from "@/types/general-faq";

type GeneralFaqViewDialogProps = {
  faq: GeneralFaq | null;
  onClose: () => void;
};

export function GeneralFaqViewDialog({ faq, onClose }: GeneralFaqViewDialogProps) {
  if (!faq) return null;

  return (
    <DetailSheet
      open={!!faq}
      onClose={onClose}
      title="FAQ Details"
      description={faq.question}
      sections={[
        {
          heading: "FAQ",
          rows: [
            { label: "Question", value: faq.question },
            { label: "Answer", value: <span className="whitespace-pre-wrap">{faq.answer}</span> },
            { label: "Status", value: <StatusBadge status={faq.status} /> },
          ],
        },
        {
          heading: "Timestamps",
          rows: [
            { label: "Created", value: formatDate(faq.created_at) },
            { label: "Updated", value: formatDate(faq.updated_at) },
          ],
        },
      ]}
    />
  );
}
