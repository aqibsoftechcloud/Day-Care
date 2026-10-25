"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  createPageSection,
  deletePageSection,
  duplicatePageSection,
  listPageSections,
  reorderPageSections,
  updatePageSection,
} from "@/lib/api/page-sections";
import { notify } from "@/lib/toast";
import { PageSectionCard } from "./PageSectionCard";
import type { CreatePageSectionInput, PageSection, PageSectionType } from "@/types/page-section";

const pageSectionsKey = (pageId: number) => ["page-sections", pageId] as const;

const ADD_SECTION_OPTIONS: { type: PageSectionType; label: string }[] = [
  { type: "hero", label: "Hero" },
  { type: "about", label: "About" },
  { type: "features", label: "Features" },
  { type: "content", label: "Content" },
  { type: "cta", label: "CTA" },
  { type: "hospital_listing", label: "Hospital Listing" },
];

/** A minimal, honest starting point per type — not real copy, just enough to satisfy each section's required fields until the admin fills it in. New sections are created `inactive` so a half-filled placeholder never renders publicly (see PageSectionsPanel's create mutation). */
function defaultContentFor(type: PageSectionType): CreatePageSectionInput {
  switch (type) {
    case "hero":
      return { section_type: "hero", content: { title: "New Hero Section", subtitle: "", cta_text: "", cta_url: "" } };
    case "about":
      return { section_type: "about", content: { heading: "About", content: "<p></p>" } };
    case "features":
      return {
        section_type: "features",
        content: { heading: "Features", items: [{ title: "Feature 1", description: "", image: null }] },
      };
    case "content":
      return { section_type: "content", content: { heading: "Content", content: "<p></p>" } };
    case "cta":
      return { section_type: "cta", content: { heading: "Need help?", description: "", button_text: "Learn More", button_url: "#" } };
    case "hospital_listing":
      return { section_type: "hospital_listing", content: { heading: "Our Hospitals", description: "", columns: 3, initial_count: 6, load_more: true } };
  }
}

export function PageSectionsPanel({ pageId }: { pageId: number }) {
  const queryClient = useQueryClient();
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [savingSectionId, setSavingSectionId] = useState<number | null>(null);

  const sectionsQuery = useQuery({
    queryKey: pageSectionsKey(pageId),
    queryFn: () => listPageSections(pageId),
  });
  const sections = sectionsQuery.data?.sections ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: pageSectionsKey(pageId) });

  const createMutation = useMutation({
    mutationFn: (type: PageSectionType) => createPageSection(pageId, { ...defaultContentFor(type), status: "inactive" }),
    onSuccess: () => {
      notify.success("Section added — fill it in, then switch it to Active.");
      invalidate();
    },
    onError: (error) => notify.apiError(error),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      updatePageSection(pageId, id, { status: active ? "active" : "inactive" }),
    onSuccess: invalidate,
    onError: (error) => notify.apiError(error),
  });

  const contentMutation = useMutation({
    mutationFn: ({ id, content }: { id: number; content: Record<string, unknown> }) =>
      updatePageSection(pageId, id, { content }),
    onMutate: ({ id }) => setSavingSectionId(id),
    onSuccess: () => {
      notify.success("Section saved.");
      invalidate();
    },
    onError: (error) => notify.apiError(error),
    onSettled: () => setSavingSectionId(null),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: number) => duplicatePageSection(pageId, id),
    onSuccess: () => {
      notify.success("Section duplicated.");
      invalidate();
    },
    onError: (error) => notify.apiError(error),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePageSection(pageId, id),
    onSuccess: () => {
      notify.success("Section deleted.");
      invalidate();
    },
    onError: (error) => notify.apiError(error),
  });

  const reorderMutation = useMutation({
    mutationFn: (order: { id: number; section_order: number }[]) => reorderPageSections(pageId, { order }),
    onSuccess: invalidate,
    onError: (error) => {
      notify.apiError(error);
      invalidate();
    },
  });

  function commitReorder(fromId: number, toId: number) {
    if (fromId === toId) return;
    const current = [...sections].sort((a, b) => a.section_order - b.section_order);
    const fromIndex = current.findIndex((s) => s.id === fromId);
    const toIndex = current.findIndex((s) => s.id === toId);
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
      {sorted.length === 0 && (
        <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-body-sm text-muted-foreground">
          No sections yet. Add one below to start building this page&apos;s structured content.
        </p>
      )}

      {sorted.map((section: PageSection, index) => (
        <PageSectionCard
          key={section.id}
          section={section}
          order={index + 1}
          savingContent={savingSectionId === section.id}
          onToggleStatus={(active) => statusMutation.mutate({ id: section.id, active })}
          onDuplicate={() => duplicateMutation.mutate(section.id)}
          onDelete={() => {
            if (window.confirm("Delete this section? This can't be undone.")) {
              deleteMutation.mutate(section.id);
            }
          }}
          onSaveContent={async (content) => {
            await contentMutation.mutateAsync({ id: section.id, content });
          }}
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="w-fit" disabled={createMutation.isPending}>
            <Plus className="size-4" aria-hidden="true" />
            Add Section
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {ADD_SECTION_OPTIONS.map((option) => (
            <DropdownMenuItem key={option.type} onSelect={() => createMutation.mutate(option.type)}>
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
