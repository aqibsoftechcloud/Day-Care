"use client";

import { Accordion as AccordionPrimitive } from "radix-ui";
import { ChevronDown } from "lucide-react";
import { SectionHeader } from "@/components/public/shared/SectionHeader";
import { ExpandableList } from "@/components/public/shared/ExpandableList";

const INITIAL_LIMIT = 5;

export type DoctorFaqItem = {
  id: number;
  question: string;
  answer: string;
};

type DoctorFaqsProps = {
  /**
   * Real, doctor-specific FAQs only — `doctor_faqs` rows for this doctor
   * (see `lib/public/doctors.ts`'s `PublicDoctorFaq`), already filtered to
   * `status: "active"`. Never a generic/speciality-level FAQ list
   * presented as if it belonged to this individual doctor.
   */
  faqs: DoctorFaqItem[];
};

/**
 * "Frequently Asked Questions" — real data only, from the admin's own
 * `doctor_faqs` CMS entry. Same accordion pattern as
 * `SpecialityFaq.tsx`/`TreatmentFaq.tsx` (same Radix primitive, same
 * classNames), and the same `ExpandableList` show-more pattern already
 * established on the Hospital Detail Page — initially shows 5. Renders
 * nothing when `faqs` is empty.
 */
export function DoctorFaqs({ faqs }: DoctorFaqsProps) {
  if (faqs.length === 0) return null;

  return (
    <section
      id="doctor-faqs-heading"
      aria-labelledby="doctor-faqs-title"
      className="public-container scroll-mt-20 py-6 sm:py-8"
    >
      <SectionHeader compact eyebrow="FAQ" title="Frequently Asked Questions" headingId="doctor-faqs-title" />

      <div className="mt-6 max-w-3xl">
        <AccordionPrimitive.Root type="single" collapsible className="flex flex-col gap-4">
          <ExpandableList
            items={faqs.map((faq) => (
              <AccordionPrimitive.Item
                key={faq.id}
                value={String(faq.id)}
                className="overflow-hidden rounded-2xl border border-(--color-faq-border) bg-(--color-faq-background) transition-colors data-[state=open]:bg-white data-[state=open]:shadow-xs"
              >
                <AccordionPrimitive.Header>
                  <AccordionPrimitive.Trigger className="group flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-slate-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-faq-icon) focus-visible:-outline-offset-2 data-[state=open]:hover:bg-transparent">
                    <span className="text-base font-semibold text-(--color-faq-heading)">{faq.question}</span>
                    <ChevronDown
                      className="size-5 shrink-0 text-(--color-faq-heading)/50 transition-transform duration-300 group-data-[state=open]:rotate-180 group-data-[state=open]:text-(--color-faq-icon)"
                      aria-hidden="true"
                    />
                  </AccordionPrimitive.Trigger>
                </AccordionPrimitive.Header>
                <AccordionPrimitive.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up motion-reduce:animate-none">
                  <p className="px-6 pb-5 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
                </AccordionPrimitive.Content>
              </AccordionPrimitive.Item>
            ))}
            initialLimit={INITIAL_LIMIT}
            itemsClassName="flex flex-col gap-4"
            moreLabel="View More FAQs"
          />
        </AccordionPrimitive.Root>
      </div>
    </section>
  );
}
