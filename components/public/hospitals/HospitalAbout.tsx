"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SectionHeader } from "@/components/public/shared/SectionHeader";

type HospitalAboutProps = {
  /** Real `hospitals.hospital_description` only (plain text — the admin form's own `<Textarea>` field) — never fabricated content. `long_description` (rich HTML, Tiptap) is deliberately not rendered here; that needs its own rendering decision, same as Doctor's `doc_info`. */
  about: string | null;
};

/**
 * "About Hospital" — real data only, renders nothing when the hospital
 * has no description yet (no placeholder text stands in for it). "Read
 * More" clamp (`line-clamp-4`) only shown once the text is actually long
 * enough to need it.
 */
export function HospitalAbout({ about }: HospitalAboutProps) {
  const [expanded, setExpanded] = useState(false);

  if (!about) return null;

  return (
    <section
      id="hospital-about-heading"
      aria-labelledby="hospital-about-title"
      className="public-container scroll-mt-20 py-10 sm:py-12"
    >
      <SectionHeader eyebrow="Overview" title="About Hospital" headingId="hospital-about-title" />

      <div className="mt-6 max-w-3xl">
        <p className={`text-sm leading-relaxed text-slate-600 sm:text-base ${expanded ? "" : "line-clamp-4"}`}>{about}</p>

        {about.length > 320 && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="group mt-3 inline-flex items-center gap-1 text-sm font-semibold text-(--public-primary) transition-colors hover:text-(--public-accent) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
          >
            {expanded ? "Read Less" : "Read More"}
            <ChevronDown
              className={`size-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
        )}
      </div>
    </section>
  );
}
