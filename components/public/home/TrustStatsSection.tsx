import { getHomepageTrustStats } from "@/lib/public/homepage";
import { getCachedPublicHomepageIconComponents } from "@/lib/public/homepage-icons";
import { HomepageIconGlyph } from "./HomepageIconGlyph";

type TrustStatsSectionProps = {
  /** The already-resolved city id from the root resolver (`null` on the nationwide `/` homepage) — never re-derived here. */
  currentCityId: number | null;
};

/**
 * Compact trust strip directly below the Hero — real counts only
 * (`getHomepageTrustStats`), reusing the same service calls every other
 * homepage section already makes. There is no "patients"/"consultations"
 * aggregate anywhere in this schema, so that metric is intentionally not
 * shown — only Specialities/Treatments/Doctors/Hospitals, and only the
 * ones that are actually non-zero (a "0 Hospitals" tile would read as a
 * negative claim, not a trust signal). Renders nothing when every count
 * is zero.
 *
 * Each tile's icon is CMS-configurable (see `lib/public/homepage-icons.ts`
 * — global default, overridable per city) rather than hardcoded; counts,
 * labels, ordering, and links are entirely unaffected.
 */
export async function TrustStatsSection({ currentCityId }: TrustStatsSectionProps) {
  const [stats, icons] = await Promise.all([
    getHomepageTrustStats(currentCityId),
    getCachedPublicHomepageIconComponents(currentCityId),
  ]);

  const tiles = [
    { key: "specialities", label: stats.specialitiesCount === 1 ? "Speciality" : "Specialities", value: stats.specialitiesCount, icon: icons.hero_specialities },
    { key: "treatments", label: stats.treatmentsCount === 1 ? "Treatment" : "Treatments", value: stats.treatmentsCount, icon: icons.hero_treatments },
    { key: "doctors", label: stats.doctorsCount === 1 ? "Doctor" : "Doctors", value: stats.doctorsCount, icon: icons.hero_doctors },
    { key: "hospitals", label: stats.hospitalsCount === 1 ? "Hospital" : "Hospitals", value: stats.hospitalsCount, icon: icons.hero_hospitals },
  ].filter((tile) => tile.value > 0);

  if (tiles.length === 0) {
    return null;
  }

  return (
    <section aria-label="Day Care Surgeries at a glance" className="border-b border-slate-200 bg-white">
      <div className="public-container py-6 sm:py-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          {tiles.map(({ key, label, value, icon }) => (
            <div key={key} className="flex items-center gap-3.5 sm:gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-(--color-icon-border) bg-(--color-icon-background) text-(--color-icon-foreground) sm:size-14">
                <HomepageIconGlyph icon={icon} className="size-8 sm:size-8" />
              </span>
              <div>
                <p className="text-xl font-black tracking-tight text-(--public-primary) sm:text-2xl">{value}</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-500 sm:text-sm">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
