"use client";

import { Accordion as AccordionPrimitive } from "radix-ui";
import { motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import type { HomepageFaq } from "@/lib/public/homepage";

type FAQAccordionProps = {
  faqs: HomepageFaq[];
};

/**
 * Built directly on radix-ui's Accordion primitive — the exact same
 * underlying library components/ui/accordion.tsx already wraps — rather
 * than reusing that shared component itself: its trigger hardcodes the
 * chevron's size/color inside its own JSX (not exposed as an overridable
 * prop) and its item styling assumes a flat, bottom-bordered admin list,
 * neither of which fits the locked "separate rounded, bordered, light-
 * surface row" visual here. This still gets the part that actually
 * matters — correct ARIA wiring, keyboard interaction, single-open-at-
 * a-time state — from the same accessible primitive, not a
 * reimplementation of accordion behavior from scratch.
 *
 * `type="single" collapsible`: exactly one item open at a time, and
 * clicking the open item again collapses it (`collapsible` is required
 * for that — without it Radix would keep the last item forced open).
 *
 * Two visual columns share one Root, so opening an item in either column
 * closes whatever was open in the other — a single accordion group, not
 * two independent ones, matching "one FAQ open at a time" across the
 * whole section.
 */
export function FAQAccordion({ faqs }: FAQAccordionProps) {
  const prefersReducedMotion = useReducedMotion();
  const half = Math.ceil(faqs.length / 2);
  const columns = [faqs.slice(0, half), faqs.slice(half)];

  return (
    <AccordionPrimitive.Root type="single" collapsible className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-6">
      {columns.map(
        (column, columnIndex) =>
          column.length > 0 && (
            <div key={columnIndex} className="flex flex-col gap-4">
              {column.map((faq, rowIndex) => (
                <motion.div
                  key={faq.id}
                  initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
                  whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.35, ease: "easeOut", delay: rowIndex * 0.06 }}
                >
                  <FAQItem faq={faq} />
                </motion.div>
              ))}
            </div>
          )
      )}
    </AccordionPrimitive.Root>
  );
}

function FAQItem({ faq }: { faq: HomepageFaq }) {
  return (
    <AccordionPrimitive.Item
      value={String(faq.id)}
      className="overflow-hidden rounded-2xl border border-(--color-faq-border) bg-(--color-faq-background) transition-colors data-[state=open]:bg-white data-[state=open]:shadow-xs"
    >
      <AccordionPrimitive.Header>
        <AccordionPrimitive.Trigger className="group flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-slate-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-faq-icon) focus-visible:-outline-offset-2 data-[state=open]:hover:bg-transparent">
          <span className="text-base font-semibold text-(--color-faq-heading) sm:text-lg">{faq.question}</span>
          <ChevronDown
            className="size-5 shrink-0 text-(--color-faq-heading)/50 transition-transform duration-300 group-data-[state=open]:rotate-180 group-data-[state=open]:text-(--color-faq-icon)"
            aria-hidden="true"
          />
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up motion-reduce:animate-none">
        <p className="px-6 pb-5 text-sm leading-relaxed text-slate-600 sm:text-base">{faq.answer}</p>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  );
}
