"use client";

import { DetailSheet } from "@/components/admin/DetailSheet";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format-date";
import { useCityLookup } from "@/components/admin/banners/useCityLookup";
import type { Banner } from "@/types/banner";

type BannerViewDialogProps = {
  banner: Banner | null;
  onClose: () => void;
};

export function BannerViewDialog({ banner, onClose }: BannerViewDialogProps) {
  const { getCityName } = useCityLookup();

  if (!banner) return null;

  return (
    <DetailSheet
      open={!!banner}
      onClose={onClose}
      title="Banner Details"
      description={banner.banner_name}
      sections={[
        {
          heading: "Banner Image",
          rows: [
            {
              label: "Desktop",
              // eslint-disable-next-line @next/next/no-img-element -- static local image from storage, shown in a read-only detail view.
              value: <img src={banner.banner_image} alt="" className="max-h-32 rounded-md border border-border object-contain" />,
            },
            {
              label: "Mobile",
              value: banner.mobile_banner_image ? (
                // eslint-disable-next-line @next/next/no-img-element -- static local image from storage, shown in a read-only detail view.
                <img
                  src={banner.mobile_banner_image}
                  alt=""
                  className="max-h-32 rounded-md border border-border object-contain"
                />
              ) : (
                "—"
              ),
            },
          ],
        },
        {
          heading: "Banner Information",
          rows: [
            { label: "Banner Name", value: banner.banner_name },
            { label: "Banner URL", value: banner.banner_url || "—" },
            { label: "City", value: getCityName(banner.city_id) },
            { label: "Sorting Order", value: String(banner.sorting_order) },
            { label: "Status", value: <StatusBadge status={banner.status} /> },
          ],
        },
        {
          heading: "Timestamps",
          rows: [
            { label: "Created", value: formatDate(banner.created_at) },
            { label: "Updated", value: formatDate(banner.updated_at) },
          ],
        },
      ]}
    />
  );
}
