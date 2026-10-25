import Link from "next/link";
import { getContactUsUrl } from "@/lib/public/urls";
import { getPublicCities } from "@/lib/public/cities";
import { getPublicMenuTree, splitByPlacement } from "@/lib/public/menu";
import { getPublicPages } from "@/lib/public/pages";
import { buildPublicNavLinkGroups } from "@/lib/public/public-nav-links";
import { CitySelector } from "@/components/public/layout/CitySelector";
import { SearchBar } from "@/components/public/layout/SearchBar";
import {
  getPublicNavSpecialities,
  mergeSecondaryMenusIntoSpecialities,
  attachGlobalTreatmentsToNavItems,
} from "@/components/public/layout/navigation";
import { PrimaryMenuNav } from "@/components/public/layout/PrimaryMenuNav";
import { SecondaryNavBar } from "@/components/public/layout/SecondaryNavBar";
import { PublicMobileHeader } from "@/components/public/layout/PublicMobileHeader";
import { HeaderBrandBarChrome } from "@/components/public/layout/HeaderBrandBarChrome";
import { HeaderVisibilityProvider } from "@/components/public/layout/HeaderVisibilityContext";

type PublicHeaderProps = {
  currentCityId: number | null;
  /**
   * Opt-in only — every existing caller keeps the header's original,
   * always-solid Brand Bar by simply omitting this prop. Pass `true`
   * only from a route that unconditionally renders a Hero banner
   * (`HeroBannerView.tsx`) directly below the header, since the
   * transparent-over-hero effect depends on that component's own
   * `[data-hero-sentinel]` marker existing in the DOM.
   */
  transparentOverHero?: boolean;
};

export async function PublicHeader({ currentCityId, transparentOverHero = false }: PublicHeaderProps) {
  // 1. Fetch cities
  const cities = await getPublicCities();
  const currentCity = cities.find((city) => city.id === currentCityId) ?? null;
  const currentCitySeoUrl = currentCity?.seoUrl ?? null;

  // 2. Fetch CMS menus (Row 1), clinical specialities (Row 2), and Pages
  // for the resolved city — `pages` is only needed for the mobile menu's
  // "Our Company" group (`buildPublicNavLinkGroups`, the same real data
  // `PublicFooter.tsx` already renders), not by anything desktop-only.
  const [specialities, menuTree, pages] = await Promise.all([
    getPublicNavSpecialities(currentCityId, currentCitySeoUrl),
    getPublicMenuTree({ cityId: currentCityId, citySeoUrl: currentCitySeoUrl }),
    getPublicPages(currentCityId),
  ]);

  // 3. Separate CMS menus by placement. Row 1 (the top CMS bar,
  // PrimaryMenuNav) renders ONLY `placement: "primary"` top-level Menu
  // Management records — a `secondary`-placement record must never
  // appear there as if it were its own top-level primary item (that was
  // the exact bug: General Surgery/Proctology/Laparoscopic Surgery, all
  // configured as "Secondary navigation" via the Global Speciality
  // Navigation tab, were leaking into Row 1 because this used to merge
  // both placements into one array).
  //
  // `secondary`-placement items are GLOBAL `menus` rows (city_id: null)
  // — they get merged into Row 2 (the Speciality row) ONLY on a page
  // with no city context. On a CITY page, Row 2's sole source of truth
  // is `getPublicNavSpecialities` (city-scoped specialities, already
  // correctly resolved to their own `/{citySeoUrl}/specialities/{seoUrl}`
  // routes) — merging the global set in there too was the exact
  // duplication bug: a city speciality like General Surgery that's ALSO
  // configured as a global secondary menu item showed up twice (its
  // city URL AND its global `/dcg/{seoUrl}` URL), because the merge's
  // own dedup compares hrefs for equality and the two url SHAPES never
  // match on a city page — and a purely global entity with no city
  // counterpart at all (e.g. Neurosurgery) leaked in with zero
  // Hyderabad relevance. See mergeSecondaryMenusIntoSpecialities's own
  // doc comment for the (still valid, global-page-only) merge/dedup
  // logic itself.
  const { primary: cmsPrimaryMenus, secondary: cmsSecondaryMenus } = splitByPlacement(menuTree);
  const row1Items = cmsPrimaryMenus;
  const row2Specialities =
    currentCityId === null
      ? await attachGlobalTreatmentsToNavItems(mergeSecondaryMenusIntoSpecialities(specialities, cmsSecondaryMenus))
      : specialities;

  // 4. Same "homeHref" convention `PublicFooter.tsx` uses — the resolved
  // city's own home, or `/` with no city context — so the mobile menu's
  // "For Patients"/"Hospitals" anchors point at the same real section on
  // the same real page the footer's equivalent links already do.
  const homeHref = currentCity ? currentCity.href : "/";
  const navLinks = buildPublicNavLinkGroups(homeHref, menuTree, pages);
  const hospitalsHref = `${homeHref}#hospitals-heading`;

  return (
    <header
      className={
        transparentOverHero
          ? // `fixed`, not `sticky`: a sticky header still reserves its own
            // height in normal flow at its natural (first-in-body)
            // position, which would push the Hero *down* below it rather
            // than letting the Hero render *behind* it — defeating the
            // whole transparent-overlay effect. `fixed` removes the
            // header from flow entirely, so the Hero naturally starts at
            // y=0 with the header floating on top. Once scrolled past the
            // Hero (solid state), this behaves identically to every other
            // page's sticky header — both pin to the viewport's top edge.
            "fixed inset-x-0 top-0 z-40 w-full"
          : "sticky top-0 z-40 w-full"
      }
    >
      <HeaderVisibilityProvider transparentOverHero={transparentOverHero}>
        {/* ===================== DESKTOP BRAND BAR (logo / search / primary nav / appointment CTA / city) ===================== */}
        {/* `hidden lg:block`: the right-side CTA + CitySelector group here
            has no mobile accommodation (it's sized for a desktop row) and
            was the one piece forcing horizontal overflow at mobile
            widths — `PublicMobileHeader` below is the dedicated compact
            replacement for `<lg`, not a squeezed-down version of this. */}
        <div className="hidden lg:block">
          <HeaderBrandBarChrome>
            <div className="public-container flex h-16 items-center justify-between gap-4">

              {/* Brand Wordmark (Logo Left) */}
              <div className="flex items-center shrink-0">
                <Link
                  href="/"
                  className="flex items-center font-black tracking-tight text-xl sm:text-2xl text-(--color-header-text) focus-visible:outline-none"
                >
                  DAY CARE <span className="text-(--color-header-active) ml-1.5">SURGERIES</span>
                </Link>
              </div>

              {/* Dual-Field Search Component */}
              <SearchBar currentCityName={currentCity?.name} citySeoUrl={currentCitySeoUrl} variant="desktop" />

              {/* ROW 1 — CMS primary menu tree, entirely Menu Management-driven.
                  Desktop only; the mobile menu (PublicMobileMenu) carries the
                  same items for small screens. */}
              <PrimaryMenuNav items={row1Items} />

              {/* Right Actions: CTA & City Selector ONLY (No nav items here) */}
              <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                <Link
                  href={getContactUsUrl({ cityId: currentCityId })}
                  className="border border-(--color-header-text)/80 hover:bg-white hover:text-(--color-header-background) text-(--color-header-text) text-sm font-semibold px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-header-background)"
                >
                  Book <strong className="font-extrabold text-(--color-header-active)">FREE</strong> Appointment
                </Link>

                <CitySelector cities={cities} currentCityId={currentCityId} />
              </div>

            </div>
          </HeaderBrandBarChrome>

          {/* ===================== DESKTOP NAVIGATION STRIP: ROW 2 (Specialities CMS) ===================== */}
          <SecondaryNavBar specialities={row2Specialities} />
        </div>

        {/* ===================== COMPACT MOBILE HEADER ===================== */}
        <PublicMobileHeader
          cities={cities}
          currentCityId={currentCityId}
          currentCityName={currentCity?.name}
          cmsRow1Items={row1Items}
          specialities={row2Specialities}
          navLinks={navLinks}
          hospitalsHref={hospitalsHref}
        />
      </HeaderVisibilityProvider>
    </header>
  );
}