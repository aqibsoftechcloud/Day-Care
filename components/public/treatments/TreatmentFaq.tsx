"use client";

import { Accordion as AccordionPrimitive } from "radix-ui";
import { ChevronDown } from "lucide-react";
import { SectionHeader } from "@/components/public/shared/SectionHeader";
import { ExpandableList } from "@/components/public/shared/ExpandableList";
import type { PublicTreatmentDetail } from "@/lib/public/treatments";

const INITIAL_LIMIT = 5;

type TreatmentFaqProps = {
  detail: PublicTreatmentDetail;
};

/**
 * Real `treatment_faqs` data — already fully CMS-driven, unchanged from
 * the original page. Initially shows 5 — `ExpandableList` reveals the
 * rest on demand; the full `faqs` array is always received complete from
 * the server, never trimmed here. Radix's `Accordion.Root` manages its
 * open/closed state via context, not direct-child DOM structure, so
 * wrapping each `Accordion.Item` (what `ExpandableList` does internally
 * for newly revealed items) doesn't affect accordion behavior.
 */
export function TreatmentFaq({ detail }: TreatmentFaqProps) {
  if (detail.faqs.length === 0) return null;

  return (
    <section aria-labelledby="treatment-faq-heading" className="public-container py-8 sm:py-10">
      <SectionHeader
        eyebrow="FAQ"
        title={`FAQs About ${detail.name}`}
        headingId="treatment-faq-heading"
        align="center"
      />
      <div className="mx-auto mt-8 max-w-240 sm:mt-10">
        <AccordionPrimitive.Root type="single" collapsible>
          <ExpandableList
            items={detail.faqs.map((faq) => (
              <AccordionPrimitive.Item
                key={faq.id}
                value={faq.title}
                className="overflow-hidden rounded-2xl border border-(--color-faq-border) bg-(--color-faq-background) transition-colors data-[state=open]:bg-white data-[state=open]:shadow-xs"
              >
                <AccordionPrimitive.Header>
                  <AccordionPrimitive.Trigger className="group flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-slate-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-faq-icon) focus-visible:-outline-offset-2 data-[state=open]:hover:bg-transparent">
                    <span className="text-base font-semibold text-(--color-faq-heading) sm:text-lg">{faq.title}</span>
                    <ChevronDown
                      className="size-5 shrink-0 text-(--color-faq-heading)/50 transition-transform duration-300 group-data-[state=open]:rotate-180 group-data-[state=open]:text-(--color-faq-icon)"
                      aria-hidden="true"
                    />
                  </AccordionPrimitive.Trigger>
                </AccordionPrimitive.Header>
                <AccordionPrimitive.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up motion-reduce:animate-none">
                  <p className="px-6 pb-5 text-sm leading-relaxed text-slate-600 sm:text-base">{faq.text}</p>
                </AccordionPrimitive.Content>
              </AccordionPrimitive.Item>
            ))}
            initialLimit={INITIAL_LIMIT}
            itemsClassName="flex flex-col gap-4 text-left"
            moreLabel="View More FAQs"
          />
        </AccordionPrimitive.Root>
      </div>
    </section>
  );
}
