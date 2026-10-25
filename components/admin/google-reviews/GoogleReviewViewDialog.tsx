"use client";

import { DetailSheet } from "@/components/admin/DetailSheet";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format-date";
import type { GoogleReview } from "@/types/google-review";

type GoogleReviewViewDialogProps = {
  review: GoogleReview | null;
  onClose: () => void;
};

export function GoogleReviewViewDialog({ review, onClose }: GoogleReviewViewDialogProps) {
  if (!review) return null;

  return (
    <DetailSheet
      open={!!review}
      onClose={onClose}
      title="Google Review Details"
      description={review.google_location}
      sections={[
        {
          heading: "Review",
          rows: [
            { label: "Location", value: review.google_location },
            { label: "Rating", value: review.google_rating ? `${review.google_rating} / 9.9` : "—" },
            { label: "Review", value: <span className="whitespace-pre-wrap">{review.google_review}</span> },
            { label: "Status", value: <StatusBadge status={review.status} /> },
          ],
        },
        {
          heading: "Timestamps",
          rows: [
            { label: "Created", value: formatDate(review.created_at) },
            { label: "Updated", value: formatDate(review.updated_at) },
          ],
        },
      ]}
    />
  );
}
