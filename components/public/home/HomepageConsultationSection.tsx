import { AppointmentLeadForm } from "@/components/public/home/AppointmentLeadForm";

/**
 * A second, later conversion point — same two-column dark-navy pattern
 * already established by `GlobalFinalCta.tsx`/`TreatmentFinalCta.tsx`/
 * `SpecialityFinalCta.tsx` (heading/description + the embedded, reused
 * `AppointmentLeadForm`), not a new composition invented for the
 * homepage. The Hero above already embeds the same form as the page's
 * primary, above-the-fold conversion point; this is the same reusable
 * component rendered a second time further down, exactly like those
 * detail pages already do — never a second form implementation, never
 * different content/configuration (see `AppointmentLeadForm`'s own doc
 * comment: it takes no props and is centrally admin-managed).
 */
export function HomepageConsultationSection() {
  return (
    <section aria-labelledby="consultation-heading" className="bg-(--color-hero-background)">
      <div className="public-container grid gap-10 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <h2 id="consultation-heading" className="text-3xl font-black tracking-tight text-(--color-hero-heading) sm:text-4xl">
            Ready to Take the Next Step?
          </h2>
          <p className="mt-4 max-w-lg text-base text-white/70 sm:text-lg">
            Tell us a little about what you need, and our care team will follow up to help you find the right
            specialist and hospital.
          </p>
        </div>

        <div id="homepage-consultation-form" className="mx-auto w-full max-w-md scroll-mt-24 lg:mx-0">
          <AppointmentLeadForm />
        </div>
      </div>
    </section>
  );
}
