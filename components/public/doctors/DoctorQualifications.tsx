import { GraduationCap } from "lucide-react";
import { SectionHeader } from "@/components/public/shared/SectionHeader";

type DoctorQualificationsProps = {
  qualification: string | null;
};

/**
 * "Education & Qualifications" — `doctors.qualification` is a single
 * free-text field (e.g. "MBBS, MS"), not a structured list of
 * {qualification, institution, year} entries, and the brief is explicit
 * that this section must not fabricate entries the backend doesn't
 * expose. Renders the one real value as a single list item; the `<ul>`
 * structure is intentionally ready to take more real entries later
 * (e.g. per-degree institution/year) without a layout change, once that
 * data genuinely exists.
 */
export function DoctorQualifications({ qualification }: DoctorQualificationsProps) {
  if (!qualification) return null;

  return (
    <section
      id="doctor-qualifications-heading"
      aria-labelledby="doctor-qualifications-title"
      className="public-container scroll-mt-20 py-6 sm:py-8"
    >
      <SectionHeader compact eyebrow="Education" title="Education & Qualifications" headingId="doctor-qualifications-title" />

      <ul className="mt-3 flex max-w-xl flex-col gap-2">
        <li className="flex items-center gap-3 rounded-(--public-radius-card) border border-slate-200 bg-white px-3.5 py-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--public-accent)/10 text-(--public-accent)">
            <GraduationCap className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 text-sm font-semibold break-words text-slate-800">{qualification}</span>
        </li>
      </ul>
    </section>
  );
}
