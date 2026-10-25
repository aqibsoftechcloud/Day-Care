"use client";

import { DetailSheet } from "@/components/admin/DetailSheet";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format-date";
import type { Gallery } from "@/types/gallery";

type GalleryViewDialogProps = {
  galleryItem: Gallery | null;
  onClose: () => void;
};

export function GalleryViewDialog({ galleryItem, onClose }: GalleryViewDialogProps) {
  if (!galleryItem) return null;

  return (
    <DetailSheet
      open={!!galleryItem}
      onClose={onClose}
      title="Gallery Item Details"
      description={galleryItem.gallery_name}
      sections={[
        {
          heading: "Gallery Information",
          rows: [
            { label: "Gallery Name", value: galleryItem.gallery_name },
            { label: "Type", value: <span className="capitalize">{galleryItem.gallery_type}</span> },
            { label: "Source", value: galleryItem.source || "—" },
            { label: "Status", value: <StatusBadge status={galleryItem.gallery_status} /> },
          ],
        },
        {
          heading: "SEO",
          rows: [
            { label: "SEO URL", value: galleryItem.seo_url },
            { label: "Meta Title", value: galleryItem.meta_title || "—" },
            { label: "Meta Description", value: galleryItem.meta_description || "—" },
            { label: "Meta Keyword", value: galleryItem.meta_keyword || "—" },
          ],
        },
        {
          heading: "Timestamps",
          rows: [
            { label: "Created", value: formatDate(galleryItem.created_at) },
            { label: "Updated", value: formatDate(galleryItem.updated_at) },
          ],
        },
      ]}
    />
  );
}
