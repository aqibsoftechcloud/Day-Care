"use client";

import { Accordion as AccordionPrimitive } from "radix-ui";
import { motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { SectionHeader } from "@/components/public/shared/SectionHeader";
import type { PublicSpecialityDetail, PublicSpecialityFaq as SpecialityFaqItem } from "@/lib/public/specialities";

type SpecialityFaqProps = {
  detail: PublicSpecialityDetail;
};

/**
 * Speciality FAQs (`speciality_faqs`), not the homepage's General FAQs —
 * a separate CMS-managed set scoped to this one speciality. Visually the
 * same accordion pattern as the homepage's `FAQAccordion` (same radix
 * primitive, same classNames), rebuilt here rather than imported since
 * that component is typed to the homepage's own `HomepageFaq` shape
 * (`question`/`answer`) and this page's DTO is `title`/`text` — the
 * pattern is reused, not the incompatible component. Renders nothing
 * when this speciality has no active FAQs.
 */
export function SpecialityFaq({ detail }: SpecialityFaqProps) {
  if (detail.faqs.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="speciality-faq-heading" className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <SectionHeader
        eyebrow="FAQ"
        title={`Most Frequently Asked Questions by ${detail.name} patients`}
        headingId="speciality-faq-heading"
        align="center"
      />

      <div className="mt-10 sm:mt-12">
        <SpecialityFaqAccordion faqs={detail.faqs} />
      </div>
    </section>
  );
}

function SpecialityFaqAccordion({ faqs }: { faqs: SpecialityFaqItem[] }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AccordionPrimitive.Root type="single" collapsible className="flex flex-col gap-4 text-left">
      {faqs.map((faq, index) => (
        <motion.div
          key={faq.id}
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
          whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.35, ease: "easeOut", delay: index * 0.06 }}
        >
          <AccordionPrimitive.Item
            value={String(faq.id)}
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
        </motion.div>
      ))}
    </AccordionPrimitive.Root>
  );
}
