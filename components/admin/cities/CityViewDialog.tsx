"use client";

import { useQuery } from "@tanstack/react-query";
import { DetailSheet } from "@/components/admin/DetailSheet";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { languagesKeys } from "@/components/admin/languages/queries";
import { listLanguages } from "@/lib/api/languages";
import { formatDate } from "@/lib/format-date";
import type { City } from "@/types/city";

type CityViewDialogProps = {
  city: City | null;
  onClose: () => void;
};

export function CityViewDialog({ city, onClose }: CityViewDialogProps) {
  const languagesQuery = useQuery({ queryKey: languagesKeys.all, queryFn: listLanguages, enabled: !!city });
  const languageName = city
    ? languagesQuery.data?.languages.find((language) => language.id === city.language_id)?.name ??
      `Language #${city.language_id}`
    : "";

  if (!city) return null;

  return (
    <DetailSheet
      open={!!city}
      onClose={onClose}
      title="City Details"
      description={city.city_name}
      sections={[
        {
          heading: "City Information",
          rows: [
            { label: "City Name", value: city.city_name },
            { label: "Language", value: languageName },
            { label: "Status", value: <StatusBadge status={city.status} /> },
          ],
        },
        {
          heading: "SEO",
          rows: [
            { label: "SEO URL", value: city.seo_url },
            { label: "Meta Title", value: city.meta_title || "—" },
            { label: "Meta Description", value: city.meta_description || "—" },
            { label: "Meta Keywords", value: city.meta_keywords || "—" },
          ],
        },
        {
          heading: "Timestamps",
          rows: [
            { label: "Created", value: formatDate(city.created_at) },
            { label: "Updated", value: formatDate(city.updated_at) },
          ],
        },
      ]}
    />
  );
}
