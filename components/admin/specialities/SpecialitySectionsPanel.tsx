"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  listSpecialitySections,
  reorderSpecialitySections,
  updateSpecialitySection,
} from "@/lib/api/speciality-sections";
import { notify } from "@/lib/toast";
import { SpecialitySectionCard } from "./SpecialitySectionCard";
import type { CustomSectionContent, SpecialitySection, SpecialitySectionType } from "@/types/speciality-section";

export const specialitySectionsKey = (specialityId: number) => ["speciality-sections", specialityId] as const;

const SECTION_LABELS: Record<Exclude<SpecialitySectionType, "custom">, string> = {
  hero: "Hero Section",
  overview: "Overview Section",
  treatments: "Treatments Section",
  symptoms: "Symptoms Section",
  why_choose_us: "Why Choose Us Section",
  doctors: "Doctors Section",
  hospital: "Hospital Section",
  faqs: "FAQs Section",
  cta: "CTA Section",
};

/** What each card's helper line says — always points back at the ONE existing source of that content, never implies a second copy lives here. */
const SECTION_DESCRIPTIONS: Record<Exclude<SpecialitySectionType, "custom">, string> = {
  hero: "Uses Speciality Name, Title, Short Description, and Logo from Basic Information.",
  overview: "Uses the Description rich text from Basic Information.",
  treatments: "Uses active Treatments linked to this speciality (Treatments module).",
  symptoms: "Uses active Symptoms linked to this speciality (Symptoms module).",
  why_choose_us: "Configure from Basic Information → Manage Why Choose Us — hidden automatically until content is added.",
  doctors: "Uses active doctors mapped to the Doctor Speciality linked in Basic Information — hidden automatically if none is linked or mapped.",
  hospital: "Uses the Hospital set in Basic Information — hidden automatically if none is set.",
  faqs: "Uses active Speciality FAQs (Speciality FAQs module) — hidden automatically if none exist.",
  cta: "Configure from Basic Information → Manage Final CTA — the closing call-to-action shown at the bottom of the page.",
};

function labelFor(section: SpecialitySection): string {
  if (section.section_type === "custom") {
    const title = (section.content as CustomSectionContent | null)?.title?.trim();
    return title || "Untitled custom section";
  }
  return SECTION_LABELS[section.section_type];
}

function descriptionFor(section: SpecialitySection): string {
  if (section.section_type === "custom") {
    return "Custom content section — edit its title, content, and image from Manage Content Sections above.";
  }
  return SECTION_DESCRIPTIONS[section.section_type];
}

/**
 * View/reorder/enable-disable for every section (fixed + custom) — this
 * panel deliberately has no Add/Edit/Delete controls of its own; custom
 * section CRUD lives entirely in the separate "Manage Content Sections"
 * dialog reachable from Basic Information (SpecialityContentSectionsDialog).
 * Reordering is id-based (works identically for fixed and custom rows,
 * unlike the old section_type-based reorder, which only worked because
 * every fixed type was unique per speciality).
 */
export function SpecialitySectionsPanel({ specialityId }: { specialityId: number }) {
  const queryClient = useQueryClient();
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  const sectionsQuery = useQuery({
    queryKey: specialitySectionsKey(specialityId),
    queryFn: () => listSpecialitySections(specialityId),
  });
  const sections = sectionsQuery.data?.sections ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: specialitySectionsKey(specialityId) });

  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      updateSpecialitySection(specialityId, id, { status: active ? "active" : "inactive" }),
    onSuccess: invalidate,
    onError: (error) => notify.apiError(error),
  });

  const reorderMutation = useMutation({
    mutationFn: (order: { id: number; section_order: number }[]) => reorderSpecialitySections(specialityId, { order }),
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
      {sorted.map((section: SpecialitySection, index) => (
        <SpecialitySectionCard
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
