"use client";

import { DetailSheet } from "@/components/admin/DetailSheet";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format-date";
import type { NewsMedia } from "@/types/news-media";

type NewsMediaViewDialogProps = {
  newsMediaItem: NewsMedia | null;
  onClose: () => void;
};

export function NewsMediaViewDialog({ newsMediaItem, onClose }: NewsMediaViewDialogProps) {
  if (!newsMediaItem) return null;

  return (
    <DetailSheet
      open={!!newsMediaItem}
      onClose={onClose}
      title="News & Media Details"
      description={newsMediaItem.title}
      sections={[
        {
          heading: "News & Media Information",
          rows: [
            { label: "Title", value: newsMediaItem.title },
            { label: "Location", value: newsMediaItem.location || "—" },
            { label: "Date", value: newsMediaItem.date ? formatDate(newsMediaItem.date) : "—" },
            { label: "View Link", value: newsMediaItem.view_link || "—" },
            { label: "Status", value: <StatusBadge status={newsMediaItem.status} /> },
          ],
        },
        {
          heading: "Content",
          rows: [
            {
              label: "View Image",
              value: newsMediaItem.view_image ? (
                // eslint-disable-next-line @next/next/no-img-element -- small preview of the stored uploaded image.
                <img src={newsMediaItem.view_image} alt="" className="max-h-16 rounded-md border border-border object-contain" />
              ) : (
                "—"
              ),
            },
          ],
        },
        {
          heading: "Timestamps",
          rows: [
            { label: "Created", value: formatDate(newsMediaItem.created_at) },
            { label: "Updated", value: formatDate(newsMediaItem.updated_at) },
          ],
        },
      ]}
    />
  );
}
