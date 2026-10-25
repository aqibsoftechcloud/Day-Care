"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";

export type BlogFaqDraft = {
  /** Stable React key: the real DB id (as a string) for an existing FAQ, or a client-generated temp key for one not yet saved. */
  key: string;
  /** `null` means this FAQ doesn't exist in the DB yet — the parent creates it on save; a real id means the parent updates (or deletes) it. */
  id: number | null;
  title: string;
  text: string;
  status: "active" | "inactive";
  sorting_order: number;
};

type BlogFaqsEditorProps = {
  faqs: BlogFaqDraft[];
  onChange: (faqs: BlogFaqDraft[]) => void;
  disabled?: boolean;
};

function makeTempKey() {
  return `new-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

/**
 * Repeatable, accordion-based FAQ editor embedded directly in the Blog
 * Add/Edit form — replaces the old standalone Blog FAQs admin page. Each
 * FAQ is a collapsed row by default (question + status as the summary),
 * expanding to reveal Question/Answer/Status; this keeps the form usable
 * with 20+ FAQs instead of a permanently-expanded flat list. All state
 * here is plain React state, not react-hook-form fields — same pattern
 * `SearchableMultiSelect` already established for list-shaped form data
 * in DoctorFormDialog — and every interactive control is `type="button"`
 * since this renders inside the outer Blog `<form>`.
 *
 * "Delete" removes the row from this list; the parent (BlogFormDialog)
 * diffs against the FAQs that were originally loaded and calls the
 * existing `deleteBlogFaq()` (a soft delete — sets status to "inactive",
 * same convention as every other module in this app) for any real id no
 * longer present, only on Save — nothing is deleted until the blog form
 * itself is submitted.
 */
export function BlogFaqsEditor({ faqs, onChange, disabled }: BlogFaqsEditorProps) {
  const [expanded, setExpanded] = useState<string[]>([]);

  const addFaq = () => {
    const draft: BlogFaqDraft = {
      key: makeTempKey(),
      id: null,
      title: "",
      text: "",
      status: "active",
      sorting_order: faqs.length,
    };
    onChange([...faqs, draft]);
    setExpanded((prev) => [...prev, draft.key]);
  };

  const updateFaq = (key: string, patch: Partial<BlogFaqDraft>) => {
    onChange(faqs.map((faq) => (faq.key === key ? { ...faq, ...patch } : faq)));
  };

  const removeFaq = (key: string) => {
    onChange(
      faqs
        .filter((faq) => faq.key !== key)
        .map((faq, index) => ({ ...faq, sorting_order: index }))
    );
  };

  const moveFaq = (key: string, direction: -1 | 1) => {
    const index = faqs.findIndex((faq) => faq.key === key);
    const targetIndex = index + direction;
    if (index === -1 || targetIndex < 0 || targetIndex >= faqs.length) return;

    const reordered = [...faqs];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    onChange(reordered.map((faq, i) => ({ ...faq, sorting_order: i })));
  };

  return (
    <div className="flex flex-col gap-3">
      {faqs.length === 0 ? (
        <p className="text-body-sm text-muted-foreground">No FAQs added yet.</p>
      ) : (
        <Accordion type="multiple" value={expanded} onValueChange={setExpanded} className="rounded-lg border border-border">
          {faqs.map((faq, index) => (
            <AccordionItem key={faq.key} value={faq.key} className="px-3.5">
              <div className="flex items-center gap-1">
                <AccordionTrigger className="py-3.5 hover:no-underline">
                  <span className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                    <span className="shrink-0 text-caption font-semibold text-muted-foreground">
                      FAQ {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate text-body-sm font-medium text-foreground">
                      {faq.title.trim() || "Untitled question"}
                    </span>
                    {faq.status === "inactive" && (
                      <Badge variant="secondary" className="shrink-0">
                        Inactive
                      </Badge>
                    )}
                  </span>
                </AccordionTrigger>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={disabled || index === 0}
                    onClick={() => moveFaq(faq.key, -1)}
                    aria-label="Move FAQ up"
                  >
                    <ChevronUp className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={disabled || index === faqs.length - 1}
                    onClick={() => moveFaq(faq.key, 1)}
                    aria-label="Move FAQ down"
                  >
                    <ChevronDown className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={disabled}
                    onClick={() => removeFaq(faq.key)}
                    aria-label="Delete FAQ"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
              <AccordionContent>
                <div className="flex flex-col gap-4 pb-1">
                  <Field data-invalid={!faq.title.trim() || undefined}>
                    <FieldLabel htmlFor={`blog-faq-title-${faq.key}`}>
                      Question <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id={`blog-faq-title-${faq.key}`}
                      value={faq.title}
                      onChange={(e) => updateFaq(faq.key, { title: e.target.value })}
                      placeholder="e.g. How often should I get a checkup?"
                      disabled={disabled}
                    />
                  </Field>

                  <Field data-invalid={!faq.text.trim() || undefined}>
                    <FieldLabel htmlFor={`blog-faq-text-${faq.key}`}>
                      Answer <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Textarea
                      id={`blog-faq-text-${faq.key}`}
                      rows={4}
                      value={faq.text}
                      onChange={(e) => updateFaq(faq.key, { text: e.target.value })}
                      placeholder="Write the full answer here"
                      disabled={disabled}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor={`blog-faq-status-${faq.key}`}>Status</FieldLabel>
                    <Select
                      value={faq.status}
                      onValueChange={(value) => updateFaq(faq.key, { status: value as "active" | "inactive" })}
                      disabled={disabled}
                    >
                      <SelectTrigger id={`blog-faq-status-${faq.key}`} className="w-full sm:w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <Button type="button" variant="outline" size="sm" onClick={addFaq} disabled={disabled} className="w-fit">
        <Plus className="size-4" aria-hidden="true" />
        Add FAQ
      </Button>
    </div>
  );
}
