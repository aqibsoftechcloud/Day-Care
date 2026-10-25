"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  listTreatmentSections,
  reorderTreatmentSections,
  updateTreatmentSection,
} from "@/lib/api/treatment-sections";
import { notify } from "@/lib/toast";
import { TreatmentSectionCard } from "./TreatmentSectionCard";
import type { CustomSectionContent, TreatmentSection, TreatmentSectionType } from "@/types/treatment-section";

export const treatmentSectionsKey = (treatmentId: number) => ["treatment-sections", treatmentId] as const;

const SECTION_LABELS: Record<Exclude<TreatmentSectionType, "custom">, string> = {
  hero: "Hero Section",
  highlights: "Highlights Strip",
  overview: "Overview Section",
  facts: "Treatment Facts",
  symptoms: "Symptoms Section",
  options: "Types / Options Section",
  eligibility: "Eligibility Section",
  why_choose_us: "Why Choose Us Section",
  doctors: "Doctors Section",
  process: "Treatment Process Section",
  journey: "Patient Treatment Journey",
  hospital: "Hospital Section",
  preparation_recovery: "Preparation / Recovery / Aftercare",
  faqs: "FAQs Section",
  cta: "CTA Section",
};

/** What each card's helper line says — always points back at the ONE existing source of that content, never implies a second copy lives here. */
const SECTION_DESCRIPTIONS: Record<Exclude<TreatmentSectionType, "custom">, string> = {
  hero: "Uses Treatment Name, Title, Short Description, and Logo from Basic Information.",
  highlights: "Configure from Basic Information → Manage Highlights — hidden automatically until content is added.",
  overview: "Uses the Description rich text from Basic Information.",
  facts: "Configure from Basic Information → Manage Treatment Facts — hidden automatically until content is added.",
  symptoms: "Uses active Symptoms linked to this treatment (Treatment Symptoms module).",
  options: "Configure from Basic Information → Manage Types/Options — hidden automatically until content is added.",
  eligibility: "Configure from Basic Information → Manage Eligibility — hidden automatically until content is added.",
  why_choose_us: "Configure from Basic Information → Manage Why Choose Us — hidden automatically until content is added.",
  doctors: "Uses active doctors mapped to the parent Speciality's linked Doctor Speciality, scoped to this treatment's city.",
  process: "Configure from Basic Information → Manage Treatment Process — hidden automatically until content is added.",
  journey: "Configure from Basic Information → Manage Patient Journey — hidden automatically until content is added.",
  hospital: "Uses the Hospital set in Basic Information — hidden automatically if none is set.",
  preparation_recovery: "Configure from Basic Information → Manage Preparation/Recovery — hidden automatically until content is added.",
  faqs: "Uses active Treatment FAQs (Treatment FAQs module) — hidden automatically if none exist.",
  cta: "Configure from Basic Information → Manage Final CTA — the closing call-to-action shown at the bottom of the page.",
};

function labelFor(section: TreatmentSection): string {
  if (section.section_type === "custom") {
    const title = (section.content as CustomSectionContent | null)?.title?.trim();
    return title || "Untitled custom section";
  }
  return SECTION_LABELS[section.section_type];
}

function descriptionFor(section: TreatmentSection): string {
  if (section.section_type === "custom") {
    return "Custom content section — edit its title, content, and image from Manage Content Sections above.";
  }
  return SECTION_DESCRIPTIONS[section.section_type];
}

/**
 * View/reorder/enable-disable for every section (fixed + custom) —
 * mirrors `SpecialitySectionsPanel.tsx` exactly, fully independent
 * `treatment_sections` data source. No Add/Edit/Delete controls of its
 * own; custom section CRUD lives entirely in the separate "Manage
 * Content Sections" dialog reachable from Basic Information.
 */
export function TreatmentSectionsPanel({ treatmentId }: { treatmentId: number }) {
  const queryClient = useQueryClient();
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  const sectionsQuery = useQuery({
    queryKey: treatmentSectionsKey(treatmentId),
    queryFn: () => listTreatmentSections(treatmentId),
  });
  const sections = sectionsQuery.data?.sections ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: treatmentSectionsKey(treatmentId) });

  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      updateTreatmentSection(treatmentId, id, { status: active ? "active" : "inactive" }),
    onSuccess: invalidate,
    onError: (error) => notify.apiError(error),
  });

  const reorderMutation = useMutation({
    mutationFn: (order: { id: number; section_order: number }[]) => reorderTreatmentSections(treatmentId, { order }),
    onSuccess: invalidate,
    onError: (error) => {
      notify.apiError(error);
      invalidate();
    },
  });

  function commitReorder(fromId: number, toId: number) {
    if (fromId === toId) return;
    const current = [...sections].sort((a, b) => a.section_order - b.section_order);
    const fromIndex = current.findIndex((section) => section.id === fromId);
    const toIndex = current.findIndex((section) => section.id === toId);
    if (fromIndex === -1 || toIndex === -1) return;

    const reordered = [...current];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    reorderMutation.mutate(reordered.map((section, index) => ({ id: section.id, section_order: index })));
  }

  if (sectionsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-body-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading sections…
      </div>
    );
  }

  const sorted = [...sections].sort((a, b) => a.section_order - b.section_order);

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((section: TreatmentSection, index) => (
        <TreatmentSectionCard
          key={section.id}
          section={section}
          order={index + 1}
          label={labelFor(section)}
          description={descriptionFor(section)}
          onToggleStatus={(active) => statusMutation.mutate({ id: section.id, active })}
          draggable
          onDragStart={() => setDragId(section.id)}
          onDragOver={() => setDragOverId(section.id)}
          onDragEnd={() => {
            if (dragId !== null && dragOverId !== null) {
              commitReorder(dragId, dragOverId);
            }
            setDragId(null);
            setDragOverId(null);
          }}
          isDragTarget={dragOverId === section.id && dragId !== section.id}
        />
      ))}
    </div>
  );
}
