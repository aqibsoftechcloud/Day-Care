import { getHomepageFaqs } from "@/lib/public/homepage";
import { SectionHeader } from "@/components/public/shared/SectionHeader";
import { FAQAccordion } from "./FAQAccordion";

/**
 * Server Component: fetches active General FAQs once and hands them, as
 * a public-safe DTO, to the Client Component that needs interactivity
 * (the accordion). Renders nothing when there are no active FAQs — never
 * an empty shell, never a fabricated question.
 *
 * No city prop at all: `general_faqs` has no `city_id` column (confirmed
 * by reading the schema) — it's a genuinely global, site-wide FAQ set,
 * not something to (incorrectly) filter per city. Same reasoning as
 * Google Reviews' section, just with a real, sourced reason rather than
 * an unreliable free-text field.
 *
 * No "View All FAQs" CTA: no `/faqs` route exists yet (confirmed: no
 * matching file under `app/(public)/`), even though `getFaqsUrl()` is
 * already defined in lib/public/urls.ts — same pre-existing "page not
 * built yet" gap already flagged for every other homepage section, and
 * building it is out of this task's explicit scope.
 */
export async function FAQSection() {
  const faqs = await getHomepageFaqs();

  if (faqs.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="faq-heading" className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <SectionHeader
        eyebrow="Frequently Asked Questions"
        title="Everything You Need to Know"
        headingId="faq-heading"
        description="Find answers to common questions about day care procedures, appointments and recovery."
        align="center"
      />

      <div className="mt-10 text-left sm:mt-12">
        <FAQAccordion faqs={faqs} />
      </div>
    </section>
  );
}
