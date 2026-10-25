"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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

export type GlobalTreatmentFaqDraft = {
  /** Stable React key: the real DB id (as a string) for an existing FAQ, or a client-generated temp key for one not yet saved. */
  key: string;
  /** `null` means this FAQ doesn't exist in the DB yet — the parent creates it on save; a real id means the parent updates (or deletes) it. */
  id: number | null;
  title: string;
  text: string;
  status: "active" | "inactive";
};

type GlobalTreatmentFaqsEditorProps = {
  faqs: GlobalTreatmentFaqDraft[];
  onChange: (faqs: GlobalTreatmentFaqDraft[]) => void;
  disabled?: boolean;
};

function makeTempKey() {
  return `new-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

/** Same accordion-based repeatable FAQ editor as `TreatmentFaqsEditor.tsx` — own independent copy per this codebase's established per-module convention. "Remove" removes the row from this list; the parent diffs against originally-loaded FAQs and soft-deletes any real id no longer present, only on Save. */
export function GlobalTreatmentFaqsEditor({ faqs, onChange, disabled }: GlobalTreatmentFaqsEditorProps) {
  const [expanded, setExpanded] = useState<string[]>([]);

  const addFaq = () => {
    const draft: GlobalTreatmentFaqDraft = {
      key: makeTempKey(),
      id: null,
      title: "",
      text: "",
      status: "active",
    };
    onChange([...faqs, draft]);
    setExpanded((prev) => [...prev, draft.key]);
  };

  const updateFaq = (key: string, patch: Partial<GlobalTreatmentFaqDraft>) => {
    onChange(faqs.map((faq) => (faq.key === key ? { ...faq, ...patch } : faq)));
  };

  const removeFaq = (key: string) => {
    onChange(faqs.filter((faq) => faq.key !== key));
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
                    disabled={disabled}
                    onClick={() => removeFaq(faq.key)}
                    aria-label="Remove FAQ"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
              <AccordionContent>
                <div className="flex flex-col gap-4 pb-1">
                  <Field data-invalid={!faq.title.trim() || undefined}>
                    <FieldLabel htmlFor={`global-treatment-faq-title-${faq.key}`}>
                      Question <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id={`global-treatment-faq-title-${faq.key}`}
                      value={faq.title}
                      onChange={(e) => updateFaq(faq.key, { title: e.target.value })}
                      placeholder="e.g. Is this treatment painful?"
                      disabled={disabled}
                    />
                  </Field>

                  <Field data-invalid={!faq.text.trim() || undefined}>
                    <FieldLabel htmlFor={`global-treatment-faq-text-${faq.key}`}>
                      Answer <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Textarea
                      id={`global-treatment-faq-text-${faq.key}`}
                      rows={4}
                      value={faq.text}
                      onChange={(e) => updateFaq(faq.key, { text: e.target.value })}
                      placeholder="Write the full answer here"
                      disabled={disabled}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor={`global-treatment-faq-status-${faq.key}`}>Status</FieldLabel>
                    <Select
                      value={faq.status}
                      onValueChange={(value) => updateFaq(faq.key, { status: value as "active" | "inactive" })}
                      disabled={disabled}
                    >
                      <SelectTrigger id={`global-treatment-faq-status-${faq.key}`} className="w-full sm:w-48">
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
