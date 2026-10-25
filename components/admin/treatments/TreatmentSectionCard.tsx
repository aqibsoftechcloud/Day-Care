"use client";

import { GripVertical } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import type { TreatmentSection } from "@/types/treatment-section";

type TreatmentSectionCardProps = {
  section: TreatmentSection;
  order: number;
  label: string;
  description: string;
  onToggleStatus: (active: boolean) => void;
  draggable: boolean;
  onDragStart: () => void;
  onDragOver: () => void;
  onDragEnd: () => void;
  isDragTarget: boolean;
};

/**
 * One "☰ 01 Hero Section" card — view/reorder/toggle only. Mirrors
 * `SpecialitySectionCard.tsx` exactly. Content editing for every
 * configurable section type lives in its own dedicated "Manage …" dialog
 * reachable from Basic Information, never inline here. Custom rows get a
 * "Custom" badge so they're visually distinguishable from the fixed
 * types at a glance.
 */
export function TreatmentSectionCard({
  section,
  order,
  label,
  description,
  onToggleStatus,
  draggable,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragTarget,
}: TreatmentSectionCardProps) {
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
          aria-label={`Drag to reorder ${label}`}
          className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </span>

        <span className="text-body-sm font-mono text-muted-foreground">{String(order).padStart(2, "0")}</span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-body font-semibold text-foreground">{label}</span>
            {section.section_type === "custom" && (
              <Badge variant="secondary" className="shrink-0">
                Custom
              </Badge>
            )}
          </div>
          <p className="mt-0.5 truncate text-helper text-muted-foreground">{description}</p>
        </div>

        <label className="flex shrink-0 items-center gap-2">
          <span className="text-body-sm text-muted-foreground">{section.status === "active" ? "Active" : "Inactive"}</span>
          <Switch
            checked={section.status === "active"}
            onCheckedChange={onToggleStatus}
            aria-label={`${section.status === "active" ? "Deactivate" : "Activate"} ${label}`}
          />
        </label>
      </div>
    </div>
  );
}
