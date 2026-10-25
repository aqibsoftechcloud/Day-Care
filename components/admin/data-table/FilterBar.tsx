import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FilterBarProps = {
  /** Status/other filter controls — grouped on the left. Pass multiple as a fragment/array for multi-filter tables. */
  filters?: ReactNode;
  /** The search input — right-aligned. Omit entirely and `filters` stays left with no reserved empty space. */
  search?: ReactNode;
  className?: string;
};

/**
 * The one place that decides table-toolbar layout: filter controls
 * (status, language, city, category, date, …) grouped on the left, search
 * pushed to the right, in one row on desktop — so no page decides this via
 * its own JSX ordering or one-off CSS. Stacks to a single column on narrow
 * screens so controls never overflow or get clipped.
 */
export function FilterBar({ filters, search, className }: FilterBarProps) {
  return (
    // w-full/flex-1 is what makes `sm:ml-auto` below actually mean
    // something — without it this container only sizes to its own content
    // inside DataTable's flex toolbar row, leaving no real space for the
    // search group to expand into, so it visually sits right next to the
    // filters instead of at the toolbar's true right edge.
    <div className={cn("flex w-full flex-1 flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center", className)}>
      {filters && <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">{filters}</div>}
      {search && <div className="sm:ml-auto">{search}</div>}
    </div>
  );
}
