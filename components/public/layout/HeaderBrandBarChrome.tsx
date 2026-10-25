"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useNavbarState } from "@/components/public/layout/HeaderVisibilityContext";

/**
 * Renders the Brand Bar's background surface across the three navbar
 * states — transparent while the Hero dominates the viewport, a
 * translucent/blurred "glass" surface while it's partially scrolled
 * past, solid once it's gone. Reads the shared `HeaderVisibilityContext`
 * (owned by `HeaderVisibilityProvider`, a parent of this component in
 * `PublicHeader.tsx`) rather than running its own observer, since
 * `SecondaryNavBar.tsx` needs to transition through the exact same three
 * states in lockstep. Text/icon color is deliberately NOT varied across
 * states — every state's background is some strength of the same navy
 * theme token, so the existing light `--color-header-text` stays
 * readable throughout without needing its own per-state logic.
 */
export function HeaderBrandBarChrome({ children }: { children: ReactNode }) {
  const navbarState = useNavbarState();

  return (
    <div
      className={cn(
        "transition-[background-color,backdrop-filter,box-shadow,border-color] duration-300 ease-out text-(--color-header-text)",
        navbarState === "transparent" && "bg-transparent border-b border-transparent",
        navbarState === "glass" &&
          "bg-(--color-header-background)/55 backdrop-blur-md border-b border-white/15 shadow-sm",
        navbarState === "solid" && "bg-(--color-header-background) shadow-sm"
      )}
    >
      {children}
    </div>
  );
}
