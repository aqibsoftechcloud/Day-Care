"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SectionHeader } from "@/components/public/shared/SectionHeader";

type DoctorAboutProps = {
  /** Pre-formatted display title (e.g. "Dr. Arjun Reddy") — computed by the server-rendered caller via `doctorDisplayNameWithTitle`, not imported here directly: this is a Client Component (`useState` for Read More), and `lib/public/doctors.ts` pulls in the Prisma/MariaDB module graph, which cannot be bundled for the browser. */
  name: string;
  about: string | null;
};

/**
 * "About Doctor" — real `doctors.doctor_description` only (plain text,
 * the admin form's own `<Textarea>` field), never fabricated biography
 * copy. Renders nothing when the field is empty — no placeholder text
 * stands in for it. Same "Read More" clamp pattern as
 * `HospitalAbout.tsx`, adapted for a single string instead of an array
 * of paragraphs.
 */
export function DoctorAbout({ name, about }: DoctorAboutProps) {
  const [expanded, setExpanded] = useState(false);

  if (!about) return null;

  return (
    <section
      id="doctor-about-heading"
      aria-labelledby="doctor-about-title"
      className="public-container scroll-mt-20 py-6 sm:py-8"
    >
      <SectionHeader compact eyebrow="Overview" title={`About ${name}`} headingId="doctor-about-title" />

      <div className="mt-6 max-w-3xl">
        <p className={`text-sm leading-relaxed text-slate-600 sm:text-base ${expanded ? "" : "line-clamp-4"}`}>{about}</p>

        {about.length > 240 && (
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
