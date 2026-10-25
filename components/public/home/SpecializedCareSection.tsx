import { getHomepageSpecializedCare } from "@/lib/public/homepage";
import { getPublicCities } from "@/lib/public/cities";
import { SpecializedCareTabs } from "./SpecializedCareTabs";

type SpecializedCareSectionProps = {
  /** The already-resolved city id from the root resolver (`null` on the nationwide `/` homepage) — never re-derived here. */
  currentCityId: number | null;
};

/**
 * Server Component: fetches the three CMS-driven lists once and hands
 * them, already public-safe DTOs, to the Client Component that owns the
 * section's full composition (header + tabs + grid — see
 * `SpecializedCareTabs.tsx`, which needs the tab-selection state
 * adjacent to the grid it controls). Renders nothing at all when every
 * list is empty — never an empty section shell with nothing inside it.
 */
export async function SpecializedCareSection({ currentCityId }: SpecializedCareSectionProps) {
  const [{ specialities, treatments }, cities] = await Promise.all([
    getHomepageSpecializedCare(currentCityId),
    currentCityId !== null ? getPublicCities() : Promise.resolve([]),
  ]);
  // The "View All" cards link to this city's own listings; null (nationwide homepage) keeps the global ones.
  const citySeoUrl = cities.find((city) => city.id === currentCityId)?.seoUrl ?? null;

  if (specialities.length === 0 && treatments.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="specialized-care-heading" className="public-container py-10 sm:py-12 lg:py-16">
      <SpecializedCareTabs specialities={specialities} treatments={treatments} citySeoUrl={citySeoUrl} />
    </section>
  );
}
