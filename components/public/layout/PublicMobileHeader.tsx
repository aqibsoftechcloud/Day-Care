"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu as MenuIcon } from "lucide-react";
import type { PublicCity } from "@/lib/public/cities";
import type { PublicMenuItem } from "@/lib/public/menu-tree";
import type { PublicNavLinkGroups } from "@/lib/public/public-nav-links";
import { CitySelector } from "@/components/public/layout/CitySelector";
import { SearchBar } from "@/components/public/layout/SearchBar";
import { PublicMobileMenu } from "@/components/public/layout/PublicMobileMenu";
import type { NavSpecialityItem } from "./navigation";

type PublicMobileHeaderProps = {
  cities: PublicCity[];
  currentCityId: number | null;
  currentCityName: string | null | undefined;
  cmsRow1Items: PublicMenuItem[];
  specialities: NavSpecialityItem[];
  navLinks: PublicNavLinkGroups;
  hospitalsHref: string;
};

/**
 * Compact `lg:hidden` mobile header: a top row (logo + `CitySelector` +
 * hamburger) and a second row (full-width inline search), replacing the
 * old behavior of trying to fit the desktop Brand Bar's CTA button +
 * `CitySelector` group into a ~390px viewport (the row that was causing
 * `document.documentElement.scrollWidth` to exceed the viewport). Owns
 * the `PublicMobileMenu` drawer's open/close state — the hamburger here
 * is now the only thing that opens it (previously `SecondaryNavBar.tsx`
 * rendered its own separate, absolutely-positioned hamburger).
 */
export function PublicMobileHeader({
  cities,
  currentCityId,
  currentCityName,
  cmsRow1Items,
  specialities,
  navLinks,
  hospitalsHref,
}: PublicMobileHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="lg:hidden bg-(--color-header-background)">
      <div className="public-container flex h-14 items-center justify-between gap-2">
        <Link
          href="/"
          className="min-w-0 shrink truncate font-black tracking-tight text-sm sm:text-base text-(--color-header-text) focus-visible:outline-none"
        >
          DAY CARE <span className="text-(--color-header-active)">SURGERIES</span>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <CitySelector cities={cities} currentCityId={currentCityId} />

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="flex size-9 shrink-0 items-center justify-center rounded-md text-(--color-header-text) hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-header-background)"
          >
            <MenuIcon className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="public-container pb-3">
        <SearchBar
          currentCityName={currentCityName}
          citySeoUrl={cities.find((city) => city.id === currentCityId)?.seoUrl ?? null}
          variant="mobile"
        />
      </div>

      <PublicMobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        cmsRow1Items={cmsRow1Items}
        specialities={specialities}
        navLinks={navLinks}
        hospitalsHref={hospitalsHref}
      />
    </div>
  );
}
