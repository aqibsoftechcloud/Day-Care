import { Award } from "lucide-react";
import { SectionHeader } from "@/components/public/shared/SectionHeader";

export type DoctorAward = {
  id: number;
  title: string;
  organization: string | null;
  year: string | null;
  description: string | null;
};

type DoctorAwardsProps = {
  /**
   * Real, doctor-specific awards only — `doctor_awards` rows for this
   * doctor (see `lib/public/doctors.ts`'s `PublicDoctorAward`), already
   * filtered to `status: "active"`. Hidden when empty — never shows
   * generic/non-doctor-specific awards.
   */
  awards: DoctorAward[];
};

/**
 * "Awards & Recognitions" — real data only, from the admin's own
 * `doctor_awards` CMS entry. Kept as its own section, not folded into
 * Education, per the brief's explicit instruction. Renders nothing when
 * `awards` is empty.
 */
export function DoctorAwards({ awards }: DoctorAwardsProps) {
  if (awards.length === 0) return null;

  return (
    <section
      id="doctor-awards-heading"
      aria-labelledby="doctor-awards-title"
      className="bg-slate-50"
    >
      <div className="public-container py-6 sm:py-8">
        <SectionHeader compact eyebrow="Recognition" title="Awards & Recognitions" headingId="doctor-awards-title" />

        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {awards.map((award) => (
            <li
              key={award.id}
              className="flex items-start gap-3 rounded-(--public-radius-card) border border-slate-200 bg-white p-5"
            >
              <Award className="mt-0.5 size-5 shrink-0 text-(--public-accent)" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold text-slate-900">{award.title}</p>
                {(award.organization || award.year) && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {[award.organization, award.year].filter(Boolean).join(" · ")}
                  </p>
                )}
                {award.description && <p className="mt-1.5 text-xs text-slate-600">{award.description}</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
