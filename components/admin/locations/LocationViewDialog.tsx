"use client";

import { useQuery } from "@tanstack/react-query";
import { DetailSheet } from "@/components/admin/DetailSheet";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { citiesKeys } from "@/components/admin/cities/queries";
import { listCities } from "@/lib/api/cities";
import { formatDate } from "@/lib/format-date";
import type { Location } from "@/types/location";

type LocationViewDialogProps = {
  location: Location | null;
  onClose: () => void;
};

export function LocationViewDialog({ location, onClose }: LocationViewDialogProps) {
  const citiesQuery = useQuery({ queryKey: citiesKeys.all, queryFn: listCities, enabled: !!location });
  const cityName = location
    ? citiesQuery.data?.cities.find((city) => city.id === location.city_id)?.city_name ??
      `City #${location.city_id}`
    : "";

  if (!location) return null;

  return (
    <DetailSheet
      open={!!location}
      onClose={onClose}
      title="Location Details"
      description={location.area}
      sections={[
        {
          heading: "Location Information",
          rows: [
            { label: "Area", value: location.area },
            { label: "Zipcode", value: location.zipcode },
            { label: "Status", value: <StatusBadge status={location.status} /> },
          ],
        },
        {
          heading: "City",
          rows: [{ label: "City", value: cityName }],
        },
        {
          heading: "SEO",
          rows: [
            { label: "SEO URL", value: location.seo_url },
            { label: "Meta Title", value: location.meta_title || "—" },
            { label: "Meta Description", value: location.meta_description || "—" },
            { label: "Meta Keywords", value: location.meta_keywords || "—" },
          ],
        },
        {
          heading: "Timestamps",
          rows: [
            { label: "Created", value: formatDate(location.created_at) },
            { label: "Updated", value: formatDate(location.updated_at) },
          ],
        },
      ]}
    />
  );
}
