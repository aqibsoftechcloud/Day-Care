import Link from "next/link";

type TreatmentInlineCtaProps = {
  treatmentName: string;
  /** `/contact-us` link, already carrying this treatment's city/treatment context. */
  contactUsHref: string;
};

/**
 * A compact, restrained inline break in the article — not a full-bleed
 * marketing banner. Links to the global `/contact-us` page (the
 * shared, admin-configured `AppointmentLeadForm`) with this treatment preselected.
 */
export function TreatmentInlineCta({ treatmentName, contactUsHref }: TreatmentInlineCtaProps) {
  return (
    <div className="public-container py-6 lg:pr-125">
      <div className="flex max-w-240 flex-col items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-bold text-slate-900">Need help with {treatmentName}?</p>
          <p className="mt-0.5 text-sm text-slate-600">Speak with our specialists and understand your treatment options.</p>
        </div>
        <Link
          href={contactUsHref}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-(--public-accent) px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-(--public-accent)/90"
        >
          Book Consultation
        </Link>
      </div>
    </div>
  );
}
