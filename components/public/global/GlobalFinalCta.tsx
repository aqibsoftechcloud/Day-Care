import type { PublicGlobalContentDetail } from "@/lib/public/global-content";
import { AppointmentLeadForm } from "@/components/public/home/AppointmentLeadForm";

type GlobalFinalCtaProps = {
  detail: PublicGlobalContentDetail;
};

/**
 * Closing section matching `SpecialityFinalCta.tsx`/`TreatmentFinalCta.tsx`'s
 * exact two-column structure (heading/description + the embedded
 * `AppointmentLeadForm`, a second conversion point beneath the Hero's own
 * instance). There is no CMS-configurable CTA content at the global level
 * (`global_speciality_sections`/`global_treatment_sections` are flat
 * title/content/image rows — unlike the city schema's own dedicated `cta`
 * section type with its own heading/description/support-points/button
 * fields), so this uses static, entity-name-based copy — the exact same
 * *fallback* copy pattern the city pages themselves already fall back to
 * whenever their own CMS `cta.heading`/`cta.description` haven't been
 * configured (see `SpecialityFinalCta.tsx`'s `detail.cta.heading ||
 * "Need help with ${detail.name}?"`), never fabricated marketing claims.
 * `AppointmentLeadForm` takes no props — its title/description are the
 * same centrally admin-managed text on every page, this one included.
 */
export function GlobalFinalCta({ detail }: GlobalFinalCtaProps) {
  return (
    <section aria-labelledby="global-final-cta-heading" className="bg-(--color-hero-background)">
      <div className="public-container grid gap-10 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <h2 id="global-final-cta-heading" className="text-3xl font-black tracking-tight text-(--color-hero-heading) sm:text-4xl">
            Need help with {detail.name}?
          </h2>
          <p className="mt-4 max-w-lg text-base text-white/70 sm:text-lg">
            Share your details and our care team will call you back to help you take the next step.
          </p>
        </div>

        <div
  id="global-final-appointment-form"
  className="mx-auto w-full max-w-md scroll-mt-24 lg:ml-auto lg:translate-x-4"
>
          <AppointmentLeadForm defaultTreatment={detail.kind === "treatment" ? `global:${detail.id}` : null} />
        </div>
      </div>
    </section>
  );
}
