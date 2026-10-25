import { useQuery } from "@tanstack/react-query";
import { citiesKeys } from "@/components/admin/cities/queries";
import { listCities } from "@/lib/api/cities";

/**
 * Banners only stores the raw `city_id` FK (no embedded `city` object in
 * the API response, per services/banner.service.ts) — this resolves it to
 * a display name for the table/view dialog without a separate endpoint.
 */
export function useCityLookup() {
  const citiesQuery = useQuery({ queryKey: citiesKeys.all, queryFn: listCities });
  const cities = citiesQuery.data?.cities ?? [];

  const getCityName = (cityId: number) => cities.find((city) => city.id === cityId)?.city_name ?? `City #${cityId}`;

  return { cities, isLoading: citiesQuery.isLoading, getCityName };
}
