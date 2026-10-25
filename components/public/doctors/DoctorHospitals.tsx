import Link from "next/link";
import { ArrowRight, Building2, MapPin } from "lucide-react";
import { SectionHeader } from "@/components/public/shared/SectionHeader";
import type { PublicDoctorHospital } from "@/lib/public/doctors";

type DoctorHospitalsProps = {
  hospitals: PublicDoctorHospital[];
};

/**
 * "Associated Hospitals" — real `doctor_hospitals` rows only (active
 * hospitals, resolved by `getActiveDoctorHospitals`), never inferred
 * from city. Covers both the brief's "Clinic / Hospital Locations" and
 * "Associated Hospitals" sections, which describe the identical
 * relationship/card content — rendered once here rather than twice.
 * No "Book Appointment" action anywhere on the card; "View Hospital" is
 * the only CTA, linking to the existing public Hospital Detail route.
 */
export function DoctorHospitals({ hospitals }: DoctorHospitalsProps) {
  if (hospitals.length === 0) return null;

  return (
    <section
      id="doctor-hospitals-heading"
      aria-labelledby="doctor-hospitals-title"
      className="public-container scroll-mt-20 py-6 sm:py-8"
    >
      <SectionHeader compact eyebrow="Practices At" title="Associated Hospitals" headingId="doctor-hospitals-title" />

      {/* One hospital stays a compact card (never stretched across the row); two sit side by side; three or more fill a 3-column grid. */}
      <div
        className={`mt-4 grid grid-cols-1 gap-4 ${
          hospitals.length === 1 ? "max-w-sm" : hospitals.length === 2 ? "sm:grid-cols-2 lg:max-w-3xl" : "sm:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {hospitals.map((hospital) => (
          <Link
            key={hospital.id}
            href={hospital.href}
            className="group flex h-full flex-col overflow-hidden rounded-(--public-radius-card) border border-slate-200 bg-white shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
          >
            <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-(--public-primary)/5">
              {hospital.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- hospital_image is an admin-entered external URL (raw URL field), same as HospitalCard's own treatment of this field.
                <img
                  src={hospital.imageUrl}
                  alt={hospital.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-(--public-primary)/8 to-(--public-primary)/3">
                  <Building2 className="size-10 text-(--public-primary)/40" aria-hidden="true" />
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-1.5 p-4">
              <h3 className="line-clamp-2 text-base font-bold break-words text-slate-900">{hospital.name}</h3>
              <p className="flex items-start gap-1.5 text-sm text-slate-500">
                <MapPin className="mt-0.5 size-4 shrink-0 text-(--public-primary)/60" aria-hidden="true" />
                <span className="line-clamp-2">{hospital.address ?? hospital.cityName}</span>
              </p>
              <span className="mt-auto inline-flex items-center gap-1 pt-1.5 text-sm font-semibold text-(--public-primary) transition-colors group-hover:text-(--public-accent)">
                View Hospital
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
