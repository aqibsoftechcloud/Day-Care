"use client";

import { useState, type ReactElement } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";

type ExpandableListProps = {
  /**
   * The COMPLETE collection, already rendered into elements by the
   * (server-component) caller — each element must carry its own `key`,
   * exactly as any other `.map()` output would. This is the "children as
   * data" RSC pattern deliberately used instead of a `renderItem`
   * callback prop: a Server Component can hand a Client Component
   * already-rendered JSX, but not a plain function (React would reject
   * passing an unserializable function reference across that boundary).
   * `ExpandableList` only ever controls how many of these are rendered,
   * never how many exist — never a pre-truncated array.
   */
  items: ReactElement[];
  initialLimit: number;
  /** Wrapper classes for the items container (e.g. the existing grid/flex classes each section already uses) — layout is entirely the caller's, this component never changes it. */
  itemsClassName: string;
  moreLabel: string;
  lessLabel?: string;
};

/**
 * Presentation-only "View More / View Less" wrapper for a repeated
 * card/list collection — reused across Doctors, Treatment Options, Why
 * Choose Us, FAQs, Related Treatments, Related Blogs, and Related
 * Cities. Only the RENDERED slice changes with local `useState`; no
 * content is ever dropped, reduced, or hidden permanently.
 *
 * Newly revealed items (index >= initialLimit, once expanded) get a
 * subtle opacity-only fade via Motion — no height/layout animation,
 * since animating a CSS Grid's own track sizing as items are added is
 * unreliable across browsers; opacity alone needs no layout measurement
 * and can't itself introduce a layout bug. `prefers-reduced-motion`
 * skips the fade entirely (same convention `TreatmentJourney.tsx`
 * already uses on this same page).
 */
export function ExpandableList({ items, initialLimit, itemsClassName, moreLabel, lessLabel = "View Less" }: ExpandableListProps) {
  const [expanded, setExpanded] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const hasMore = items.length > initialLimit;
  const visible = expanded ? items : items.slice(0, initialLimit);

  return (
    <>
      <div className={itemsClassName}>
        {visible.map((node, index) => {
          if (index < initialLimit || prefersReducedMotion) return node;
          // `node.key` is a reliable React key when set by the caller, but
          // isn't guaranteed to survive every render path an element can
          // take before reaching here — the fallback is namespaced (not
          // bare `index`) so it can never collide with another visible
          // item's own data-derived key that happens to equal the same
          // number (e.g. a review with `id: 3` sitting at array index 3).
          return (
            <motion.div key={node.key ?? `expandable-item-${index}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              {node}
            </motion.div>
          );
        })}
      </div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="group inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-(--public-primary) transition-colors hover:text-(--public-accent) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
          >
            {expanded ? lessLabel : moreLabel}
            <ChevronDown
              className={`size-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
        </div>
      )}
    </>
  );
}
