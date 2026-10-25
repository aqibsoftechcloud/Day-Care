"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import type { NavSpecialityItem } from "./navigation";
import { useNavbarState } from "@/components/public/layout/HeaderVisibilityContext";
import { cn } from "@/lib/utils";

/** A visible focus ring for every nav trigger link/button in this file — the pre-existing `focus-visible:outline-none` on these triggers removed the browser default outline with no replacement, so keyboard focus was invisible. */
const NAV_TRIGGER_FOCUS_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-1 rounded-sm";

interface SecondaryNavBarProps {
  /** ROW 2 — exclusively Specialities CMS-driven (`getPublicNavSpecialities`), never Menu Management. */
  specialities: NavSpecialityItem[];
}

/**
 * ROW 2 (Specialities) as its own light nav bar directly below the dark
 * Brand Bar — desktop only (`hidden lg:block`; the caller, `PublicHeader.tsx`,
 * already wraps this inside its own `hidden lg:block` desktop section).
 * Mobile navigation (hamburger + drawer, covering both ROW 1 and ROW 2)
 * now lives in `PublicMobileHeader.tsx`/`PublicMobileMenu.tsx` instead of
 * here — extracted out so it could be triggered from the new compact
 * mobile header's own hamburger rather than this component's previous
 * absolutely-positioned one.
 *
 * Rendered nothing when there are no active specialities — matching the
 * "render nothing, never a fabricated fallback" convention every other
 * optional section on this site follows.
 */
export function SecondaryNavBar({
  specialities = [],
}: SecondaryNavBarProps) {
  // Row 2 (desktop) ALWAYS renders — both navigation levels stay present
  // in every navbar state (transparent/glass/solid); only its background/
  // border/text treatment transitions, in lockstep with the Brand Bar
  // above it, via the same shared `HeaderVisibilityContext`. Every page
  // other than a city page never leaves `"solid"`, so this renders
  // exactly as it always has there.
  const navbarState = useNavbarState();

  if (specialities.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Speciality navigation"
      className={cn(
        "hidden lg:block relative z-20 transition-[background-color,backdrop-filter,box-shadow,border-color] duration-300 ease-out",
        navbarState === "transparent" && "border-b border-white/10 bg-transparent",
        navbarState === "glass" &&
          "border-b border-white/15 bg-(--color-header-background)/45 backdrop-blur-md",
        navbarState === "solid" && "border-b border-slate-200 bg-slate-50"
      )}
    >
      <div className="public-container">
        {/* `min-w-0`: this <ul> is the sole flex item of its own row,
            but keeping it shrinkable + `flex-wrap` still lets a city with
            many specialities wrap onto a second line instead of forcing
            the row wider than the viewport. */}
        <ul
          className={cn(
            "flex min-w-0 flex-wrap items-center gap-1 xl:gap-2 min-h-11 py-1 text-[13px] font-semibold transition-colors duration-300",
            navbarState === "solid" ? "text-slate-700" : "text-white/90"
          )}
        >
          {specialities.map((speciality, index) => {
            const hasTreatments = speciality.treatments.length > 0;
            const isLast = index === specialities.length - 1;

            return (
              <li key={speciality.id} className="relative group">
                <div className="flex items-center">
                  <Link
                    href={speciality.href}
                    className={cn(
                      "flex items-center gap-1 py-2 px-3 transition-colors",
                      navbarState === "solid"
                        ? "text-slate-700 hover:text-(--public-accent)"
                        : "text-white/90 hover:text-(--color-header-active)",
                      NAV_TRIGGER_FOCUS_CLASSES
                    )}
                  >
                    <span>{speciality.title}</span>
                    {hasTreatments && (
                      <ChevronDown
                        className={cn(
                          "size-3 transition-transform duration-150 group-hover:rotate-180",
                          navbarState === "solid"
                            ? "text-slate-400 group-hover:text-(--public-accent)"
                            : "text-white/60 group-hover:text-(--color-header-active)"
                        )}
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                </div>

                {hasTreatments && (
                  // The last item's dropdown anchors `right-0` instead of
                  // `left-0` so it can never bleed past the viewport's
                  // right edge when its trigger sits near the row's end.
                  <div
                    className={`invisible group-hover:visible group-focus-within:visible opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 absolute top-full pt-1 z-50 transition-all duration-150 ${isLast ? "right-0" : "left-0"}`}
                  >
                    <div className="min-w-[200px] bg-white rounded-b-md shadow-xl border border-slate-100 py-2 max-h-[70vh] overflow-y-auto">
                      {speciality.treatments.map((treatment) => (
                        <Link
                          key={treatment.id}
                          href={treatment.href}
                          className="block px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-(--public-accent) transition-colors"
                        >
                          {treatment.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
