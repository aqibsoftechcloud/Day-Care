"use client";

import { useState } from "react";
import { HospitalCard } from "@/components/public/home/HospitalCard";
import type { PublicHospitalListingSection } from "@/lib/public/page-sections";
import { cn } from "@/lib/utils";

const COLUMN_CLASSES: Record<2 | 3 | 4, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
};

/**
 * CMS "Hospital Listing" section: a responsive grid of the shared
 * `HospitalCard` for every active hospital in every city (the data is
 * resolved server-side in `getPublicPageSections`, never typed into the
 * page). Client Component only for "Load more" — the whole list is already
 * in the page, so revealing more is instant. With no hospitals it shows a
 * plain empty state, never placeholder cards.
 */
export function PageHospitalListingSection({ section }: { section: PublicHospitalListingSection }) {
  const [visible, setVisible] = useState(section.initialCount);
  const { hospitals } = section;
  const shown = section.loadMore ? hospitals.slice(0, visible) : hospitals;
  const remaining = hospitals.length - shown.length;

  return (
    <section aria-labelledby={`page-hospital-listing-${section.id}`} className="public-container py-16 sm:py-20">
      <h2 id={`page-hospital-listing-${section.id}`} className="text-3xl font-black tracking-tight text-(--public-primary) sm:text-4xl">
        {section.heading}
      </h2>
      {section.description && <p className="mt-4 max-w-3xl text-base text-slate-600 sm:text-lg">{section.description}</p>}

      {hospitals.length === 0 ? (
        <p className="mt-10 rounded-(--public-radius-card) border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-500">
          No hospitals are available to show yet.
        </p>
      ) : (
        <>
          <div className={cn("mt-10 grid grid-cols-1 gap-5 sm:mt-12", COLUMN_CLASSES[section.columns])}>
            {shown.map((hospital) => (
              <HospitalCard key={hospital.id} hospital={hospital} />
            ))}
          </div>

          {section.loadMore && remaining > 0 && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setVisible((count) => count + section.initialCount)}
                className="rounded-lg border border-(--public-primary)/30 px-6 py-3 text-sm font-semibold text-(--public-primary) transition-colors hover:bg-(--public-primary)/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
              >
                Load more hospitals ({remaining} more)
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
