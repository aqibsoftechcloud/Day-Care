import { Briefcase, Building2, MapPin, Stethoscope } from "lucide-react";
import type { PublicDoctorDetail } from "@/lib/public/doctors";

type DoctorHighlightsProps = {
  detail: PublicDoctorDetail;
  /** Rendered inside the Hero's details column (full width of that column) instead of as its own page-width section. */
  embedded?: boolean;
};

/**
 * Compact highlight cards below the Hero. Only ever built from fields
 * `PublicDoctorDetail` genuinely has — "Languages" (suggested by the
 * reference pattern) is deliberately NOT included: `doctors.language_id`
 * is the CMS content-authoring language for this profile, not a
 * clinical "languages this doctor speaks with patients" field, and using
 * it as one would misrepresent real data. Each card self-hides when its
 * own underlying value is empty; the whole section hides if nothing
 * qualifies.
 */
export function DoctorHighlights({ detail, embedded = false }: DoctorHighlightsProps) {
  const cards = [
    detail.experience ? { icon: Briefcase, label: "Experience", value: detail.experience } : null,
    detail.specialities.length > 0
      ? { icon: Stethoscope, label: "Speciality", value: detail.specialities[0].name }
      : null,
    detail.hospitals.length > 0
      ? { icon: Building2, label: "Associated Hospitals", value: String(detail.hospitals.length) }
      : null,
    { icon: MapPin, label: "City", value: detail.cityName },
  ].filter((card): card is { icon: typeof Briefcase; label: string; value: string } => card !== null);

  if (cards.length === 0) return null;

  return (
    <section aria-label="Doctor highlights" className={embedded ? "mt-5 w-full" : "public-container pb-5 pt-1 sm:pb-6"}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="flex items-center gap-3 rounded-(--public-radius-card) border border-slate-200 bg-white px-3.5 py-3"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-(--public-accent)/10 text-(--public-accent)">
              <card.icon className="size-4.5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-slate-500">{card.label}</p>
              <p className="truncate text-sm font-bold text-slate-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
