"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Stethoscope, Syringe } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCitySpecialitiesUrl, getCityTreatmentsUrl, getSpecialitiesUrl, getTreatmentsUrl } from "@/lib/public/urls";
import type { SpecializedCareItem } from "@/lib/public/homepage";

type CategoryKey = "specialities" | "treatments";

type SpecializedCareTabsProps = {
  specialities: SpecializedCareItem[];
  treatments: SpecializedCareItem[];
  /** The current city's `seo_url`, or `null` on the nationwide homepage — decides whether "View All" opens the city's or the global listing. */
  citySeoUrl: string | null;
};

type CategoryIcon = typeof Stethoscope;

const CATEGORIES: {
  key: CategoryKey;
  label: string;
  icon: CategoryIcon;
  emptyMessage: string;
  /** The tab's "View All" destination: the current city's own listing, or the global one when `citySeoUrl` is null. */
  viewAllHref: (citySeoUrl: string | null) => string;
}[] = [
  {
    key: "specialities",
    label: "Specialities",
    icon: Stethoscope,
    emptyMessage: "No specialities are available here yet.",
    viewAllHref: (citySeoUrl) => (citySeoUrl ? getCitySpecialitiesUrl(citySeoUrl) : getSpecialitiesUrl()),
  },
  {
    key: "treatments",
    label: "Treatments",
    icon: Syringe,
    emptyMessage: "No treatments are available here yet.",
    viewAllHref: (citySeoUrl) => (citySeoUrl ? getCityTreatmentsUrl(citySeoUrl) : getTreatmentsUrl()),
  },
];

/**
 * "Explore Care That Fits Your Needs" (Specialities / Treatments) — header (heading
 * + subtitle left, category pills right) and a fixed 6-column desktop
 * grid share this one Client Component because the grid's final "View
 * All" slot and the pills both need the same tab-selection state
 * adjacent to each other. The two lists themselves are still fetched
 * server-side by `SpecializedCareSection` and passed in as plain props.
 *
 * Heading/subtitle are static copy, not swapped per active tab — unlike
 * a single-category reference section, this one genuinely covers three
 * different categories, and "Explore Our Specialities" would be
 * inaccurate copy while the Treatments tab is selected.
 * There's no CMS field backing a homepage section title either
 * (confirmed: this was always local, hardcoded copy, never DB-driven),
 * so per the task's own "use the current DCS section title/content when
 * no CMS equivalent exists" fallback, the existing category-agnostic
 * copy is kept rather than hardcoding the reference's single-category
 * wording.
 */
export function SpecializedCareTabs({ specialities, treatments, citySeoUrl }: SpecializedCareTabsProps) {
  const prefersReducedMotion = useReducedMotion();
  const tabsId = useId();

  const itemsByCategory: Record<CategoryKey, SpecializedCareItem[]> = {
    specialities,
    treatments,
  };

  // Default to the first category that actually has content, so a city
  // with e.g. zero active Specialities doesn't land on an empty tab.
  const firstNonEmpty =
    CATEGORIES.find((category) => itemsByCategory[category.key].length > 0)?.key ?? CATEGORIES[0].key;
  const [active, setActive] = useState<CategoryKey>(firstNonEmpty);

  const tabRefs = useRef<Partial<Record<CategoryKey, HTMLButtonElement | null>>>({});

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next = CATEGORIES[(index + delta + CATEGORIES.length) % CATEGORIES.length];
    setActive(next.key);
    tabRefs.current[next.key]?.focus();
  }

  const activeCategory = CATEGORIES.find((category) => category.key === active)!;
  const activeItems = itemsByCategory[active];

  return (
    <div>
      {/* ---------------- Header row: heading + subtitle (left), category pills (right) ---------------- */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl">
          <h2
            id="specialized-care-heading"
            className="text-[1.75rem] leading-tight font-bold tracking-tight text-(--public-primary) sm:text-3xl"
          >
            Explore Care That Fits Your Needs
          </h2>
          <p className="mt-2 text-base text-slate-500 sm:text-lg">
            Browse our specialities and treatments to find the care that&apos;s right for you.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Specialized care categories"
          className="flex flex-wrap items-center gap-2 overflow-x-auto"
        >
          {CATEGORIES.map((category, index) => {
            const selected = category.key === active;

            return (
              <button
                key={category.key}
                ref={(element) => {
                  tabRefs.current[category.key] = element;
                }}
                type="button"
                role="tab"
                id={`${tabsId}-tab-${category.key}`}
                aria-selected={selected}
                aria-controls={`${tabsId}-panel-${category.key}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(category.key)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={cn(
                  "shrink-0 rounded-full border border-(--public-primary) px-4.5 text-sm font-semibold transition-colors h-11",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2",
                  selected
                    ? "bg-(--public-primary)/10 text-(--public-primary)"
                    : "bg-white text-(--public-primary) hover:bg-(--public-primary)/5"
                )}
              >
                {category.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------- Grid ---------------- */}
      <div
        role="tabpanel"
        id={`${tabsId}-panel-${active}`}
        aria-labelledby={`${tabsId}-tab-${active}`}
        className="mt-8 sm:mt-10"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {activeItems.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">{activeCategory.emptyMessage}</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
                {activeItems.map((item) => (
                  <SpecializedCareCard key={item.id} item={item} icon={activeCategory.icon} />
                ))}
                <ViewAllCard label={activeCategory.label} href={activeCategory.viewAllHref(citySeoUrl)} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Premium card treatment: a soft tinted circular icon chip (the same
 * `size-* bg-(--public-primary)/8` convention `HospitalCard.tsx`/
 * `TreatmentWhyChooseUs.tsx`/`GlobalChooseYourCity.tsx` already use
 * elsewhere on this site) replaces the old bare, un-chipped ~45px icon —
 * giving a CMS-uploaded image and the Lucide fallback the exact same
 * visual treatment regardless of source, which the old layout didn't.
 * The image itself is untouched (`object-contain`, no crop, no forced
 * aspect change) — only the container around it changed. A subtle
 * "Explore" cue (muted until hover, like the icon chip and name) replaces
 * the old plain icon+name-only layout, giving the card a clearer
 * hierarchy without inventing description copy the data doesn't have.
 * `border-slate-200` + `shadow-xs` (visible, not the old near-invisible
 * `border-black/[0.08]`) and a `hover:-translate-y-0.5`/shadow/border
 * lift match the same restrained hover language `HospitalCard.tsx`/
 * `TreatmentRelatedTreatments.tsx` already use.
 */
function SpecializedCareCard({ item, icon: Icon }: { item: SpecializedCareItem; icon: CategoryIcon }) {
  // `item.imageUrl` is already filtered server-side to same-origin
  // `/uploads/...` paths (see `toLocalImageUrl` in lib/public/homepage.ts),
  // which is a shape check, not proof the file actually loads. This local
  // flag is the second, client-side half of that same fallback: if the
  // browser fails to load it for any reason (missing file, bad format,
  // ...), the card swaps to the generic icon instead of showing a
  // permanently broken image.
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(item.imageUrl) && !imageFailed;

  return (
    <Link
      href={item.href}
      aria-label={item.name}
      className="group flex h-45 flex-col items-center justify-center gap-3 rounded-(--public-radius-card) border border-slate-200 bg-white p-5 text-center shadow-xs transition-all hover:-translate-y-0.5 hover:border-(--public-accent)/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
    >
      <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-white">
        {showImage ? (
          <Image
            src={item.imageUrl as string}
            alt=""
            width={64}
            height={64}
            className="size-16 object-contain"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Icon className="size-10 text-(--public-primary)" aria-hidden="true" strokeWidth={1.5} />
        )}
      </span>

      <span className="line-clamp-2 text-sm leading-snug font-semibold text-slate-800 transition-colors group-hover:text-(--public-primary)">
        {item.name}
      </span>

      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 transition-colors group-hover:text-(--public-primary)">
        Explore
        <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </span>
    </Link>
  );
}

/**
 * The grid's final slot — now the whole tile is a single `<Link>`
 * (matching every `SpecializedCareCard`'s own whole-card click target
 * and hover-lift), replacing the earlier "plain div + separate small
 * button" structure that was deliberately copied from the original
 * design reference: that structure is exactly what made this card feel
 * visually/interactively different from the others, which is the
 * specific thing this pass was asked to fix. Same height, radius,
 * padding, and hover language as `SpecializedCareCard`, with only a
 * light primary tint distinguishing it as the CTA slot.
 */
function ViewAllCard({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      aria-label={`View all ${label}`}
      className="group flex h-45 flex-col items-center justify-center gap-3 rounded-(--public-radius-card) border border-(--public-primary)/15 bg-(--public-primary)/6 p-5 text-center shadow-xs transition-all hover:-translate-y-0.5 hover:border-(--public-primary)/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
    >
      <span className="text-sm leading-snug font-bold text-(--public-primary)">View All {label}</span>
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-(--public-primary)">
        Explore All
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </span>
    </Link>
  );
}
