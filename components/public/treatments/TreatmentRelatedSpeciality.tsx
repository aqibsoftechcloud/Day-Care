import Link from "next/link";
import { ArrowRight, Stethoscope } from "lucide-react";
import { getSpecialityUrl } from "@/lib/public/urls";
import type { PublicTreatmentDetail } from "@/lib/public/treatments";

type TreatmentRelatedSpecialityProps = {
  detail: PublicTreatmentDetail;
};

/**
 * Real parent-speciality link — `treatment.speciality_id` (existing FK),
 * built via `getSpecialityUrl(specialityCitySeoUrl, specialitySeoUrl)`
 * now that `resolvePublicTreatment` selects the parent speciality's own
 * city/seo_url (a small data-layer addition flagged in the earlier
 * audit, now resolved) — no longer a mocked `#` link.
 */
export function TreatmentRelatedSpeciality({ detail }: TreatmentRelatedSpecialityProps) {
  return (
    <section className="public-container pb-10 sm:pb-12 lg:pr-125">
      <Link
        href={getSpecialityUrl(detail.specialityCitySeoUrl, detail.specialitySeoUrl)}
        className="group flex items-center justify-between gap-4 rounded-(--public-radius-card) border border-slate-200 bg-white px-6 py-5 transition-colors hover:border-(--public-accent)/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
      >
        <span className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--public-primary)/8 text-(--public-primary)">
            <Stethoscope className="size-4.5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-xs font-semibold tracking-wide text-slate-500 uppercase">Part of</span>
            <span className="block text-base font-bold text-slate-900">{detail.specialityName}</span>
          </span>
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-(--public-primary) group-hover:text-(--public-accent)">
          View Speciality
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </Link>
    </section>
  );
}
