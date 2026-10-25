"use client";

import { useState } from "react";
import { ChevronDown, Copy, GripVertical, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ActionMenu } from "@/components/admin/data-table/ActionMenu";
import { PageSectionFieldsForm } from "./PageSectionFieldsForm";
import type { PageSection, PageSectionType } from "@/types/page-section";

const SECTION_TYPE_LABELS: Record<PageSectionType, string> = {
  hero: "Hero Section",
  about: "About Section",
  features: "Features Section",
  content: "Content Section",
  cta: "CTA Section",
  hospital_listing: "Hospital Listing",
};

type PageSectionCardProps = {
  section: PageSection;
  order: number;
  onToggleStatus: (active: boolean) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSaveContent: (content: Record<string, unknown>) => Promise<void>;
  savingContent: boolean;
  draggable: boolean;
  onDragStart: () => void;
  onDragOver: () => void;
  onDragEnd: () => void;
  isDragTarget: boolean;
};

/**
 * One "☰ 01 Hero Section" card. Expands in place to the matching
 * `PageSectionFieldsForm` — no nested dialog, matching the requested
 * mockup where a section's fields appear directly inside its own card.
 * Reordering is native HTML5 drag-and-drop (no library); the grip handle
 * is the only draggable affordance, kept mouse/touch-only by design —
 * `PageSectionsPanel` additionally exposes Move Up/Down via keyboard on
 * the same handle for accessibility.
 */
export function PageSectionCard({
  section,
  order,
  onToggleStatus,
  onDuplicate,
  onDelete,
  onSaveContent,
  savingContent,
  draggable,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragTarget,
}: PageSectionCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver();
      }}
      onDrop={(event) => event.preventDefault()}
      className={`rounded-lg border bg-card transition-colors ${isDragTarget ? "border-primary" : "border-border"}`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <span
          draggable={draggable}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          role="button"
          aria-label={`Drag to reorder ${SECTION_TYPE_LABELS[section.section_type]}`}
          className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </span>

        <span className="text-body-sm font-mono text-muted-foreground">{String(order).padStart(2, "0")}</span>

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <span className="text-body font-semibold text-foreground">{SECTION_TYPE_LABELS[section.section_type]}</span>
          <ChevronDown
            className={`size-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>

        <label className="flex items-center gap-2">
          <span className="text-body-sm text-muted-foreground">{section.status === "active" ? "Active" : "Inactive"}</span>
          <Switch
            checked={section.status === "active"}
            onCheckedChange={onToggleStatus}
            aria-label={`${section.status === "active" ? "Deactivate" : "Activate"} ${SECTION_TYPE_LABELS[section.section_type]}`}
          />
        </label>

        <ActionMenu
          label="Section actions"
          items={[
            { label: "Duplicate", icon: Copy, onSelect: onDuplicate },
            { label: "Delete", icon: Trash2, onSelect: onDelete, variant: "destructive" },
          ]}
        />
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-4">
          <PageSectionFieldsForm
            sectionType={section.section_type}
            initialContent={section.content}
            saving={savingContent}
            onCancel={() => setExpanded(false)}
            onSave={async (content) => {
              await onSaveContent(content);
              setExpanded(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
