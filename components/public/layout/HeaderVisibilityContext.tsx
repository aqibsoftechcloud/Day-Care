"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/** The complete two-row navbar's visual state — both rows always render in every state; only their background/border/shadow treatment changes. */
export type NavbarState = "transparent" | "glass" | "solid";

/** Matches the attribute `HeroBannerView.tsx` sets directly on its own root `<section>` — the one contract between this file and that one. The WHOLE Hero is the observation target (not a thin sentinel line), since the three states are driven by how much of it is still visible, not merely whether one edge has crossed a point. */
const HERO_SENTINEL_SELECTOR = "[data-hero-sentinel]";

/** Ratio thresholds translating the Hero's continuous intersection ratio into the three discrete states — tunable here without touching either consumer. Above `TRANSPARENT_MIN`: the Hero still dominates the viewport, so the navbar stays fully transparent. Between 0 and that point: the Hero is partially scrolled past — glass. At/below 0: the Hero is gone — solid. */
const TRANSPARENT_MIN_RATIO = 0.7;

/** `"solid"` is the safe fallback for any consumer rendered outside the provider — matches every page's actual, permanent header state except a city page (`transparentOverHero` is only ever passed `true` there). */
const HeaderVisibilityContext = createContext<NavbarState>("solid");

function stateFromRatio(ratio: number): NavbarState {
  if (ratio >= TRANSPARENT_MIN_RATIO) return "transparent";
  if (ratio > 0) return "glass";
  return "solid";
}

/**
 * Owns the single `IntersectionObserver` that the Brand Bar
 * (`HeaderBrandBarChrome.tsx`) and the complete Row 2 — both rows always
 * render, in every state — (`SecondaryNavBar.tsx`) both read, so they
 * can never drift out of sync. Driven by the Hero's actual
 * `intersectionRatio` against the viewport, never a `scrollY > N`
 * pixel guess: a fine-grained threshold array (0, 0.05, 0.10, … 1) means
 * the ratio — and therefore the derived state — updates continuously as
 * the user scrolls, which is what makes "fully visible -> transparent",
 * "partially visible -> glass", "gone -> solid" actually track the
 * Hero's real screen presence at any viewport size or Hero height.
 */
export function HeaderVisibilityProvider({
  transparentOverHero,
  children,
}: {
  transparentOverHero: boolean;
  children: ReactNode;
}) {
  const [navbarState, setNavbarState] = useState<NavbarState>(transparentOverHero ? "transparent" : "solid");

  useEffect(() => {
    if (!transparentOverHero) return;

    // Should never be missing in correct usage — every caller that passes
    // `transparentOverHero` unconditionally renders `HeroBannerView.tsx`,
    // whose root `data-hero-sentinel` attribute is itself unconditional.
    // If it somehow were missing, skipping `.observe()` just leaves the
    // header in its optimistic initial ("transparent") state rather than
    // correcting it.
    const hero = document.querySelector(HERO_SENTINEL_SELECTOR);
    if (!hero) return;

    const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

    const observer = new IntersectionObserver(
      ([entry]) => {
        // `intersectionRatio` is 0 whenever the element isn't
        // intersecting at all (scrolled past, in this case — the Hero is
        // always the page's first in-flow element and loads at scrollY
        // 0, so there's no "hasn't been reached yet" case to disambiguate
        // here) and the real fractional overlap otherwise — exactly the
        // continuous signal `stateFromRatio` needs.
        setNavbarState(stateFromRatio(entry.intersectionRatio));
      },
      { threshold: thresholds }
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, [transparentOverHero]);

  return <HeaderVisibilityContext.Provider value={navbarState}>{children}</HeaderVisibilityContext.Provider>;
}

/** The current navbar visual state — `"solid"` (unchanging) on every page that never opted into transparent-over-hero chrome. */
export function useNavbarState(): NavbarState {
  return useContext(HeaderVisibilityContext);
}
