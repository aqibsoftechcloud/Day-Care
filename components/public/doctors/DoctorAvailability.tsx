import { Clock } from "lucide-react";
import { SectionHeader } from "@/components/public/shared/SectionHeader";

type DoctorAvailabilityProps = {
  availability: string | null;
  monSatFirstTimings: string | null;
  monSatSecondTimings: string | null;
  sundayTimings: string | null;
  timeInterval: string | null;
};

/**
 * "Availability & Timings" — `doctors.availability` + the four timing
 * columns, all free-text fields shown exactly as the admin typed them,
 * never reformatted/reparsed (the schema has no structured time type for
 * these). Same visual pattern as `DoctorQualifications.tsx` (icon + label
 * + value cards) — reused, not a new layout. Each row only renders when
 * its own field is non-empty; the whole section hides when every field
 * is empty, same "no empty labels/placeholders" rule every other section
 * on this page already follows. This is general availability
 * information only — no booking/real-time-slot system exists, and
 * nothing here implies one.
 */
export function DoctorAvailability({
  availability,
  monSatFirstTimings,
  monSatSecondTimings,
  sundayTimings,
  timeInterval,
}: DoctorAvailabilityProps) {
  const rows = [
    availability ? { label: "Availability", value: availability } : null,
    monSatFirstTimings ? { label: "Mon – Sat First Timings", value: monSatFirstTimings } : null,
    monSatSecondTimings ? { label: "Mon – Sat Second Timings", value: monSatSecondTimings } : null,
    sundayTimings ? { label: "Sunday Timings", value: sundayTimings } : null,
    timeInterval ? { label: "Time Interval", value: timeInterval } : null,
  ].filter((row): row is { label: string; value: string } => row !== null);

  if (rows.length === 0) return null;

  return (
    <section
      id="doctor-availability-heading"
      aria-labelledby="doctor-availability-title"
      className="public-container scroll-mt-20 py-6 sm:py-8"
    >
      <SectionHeader compact eyebrow="Consultation" title="Availability & Timings" headingId="doctor-availability-title" />

      <ul className="mt-6 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-start gap-3 rounded-(--public-radius-card) border border-slate-200 bg-white p-4"
          >
            <Clock className="mt-0.5 size-5 shrink-0 text-(--public-accent)" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium text-slate-500">{row.label}</p>
              <p className="text-sm font-semibold text-slate-800 sm:text-base">{row.value}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
