"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileText, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApiError } from "@/lib/api/client";
import {
  deleteGlobalTreatmentSection,
  listGlobalTreatmentSections,
  reorderGlobalTreatmentSections,
} from "@/lib/api/global-treatment-sections";
import { notify } from "@/lib/toast";
import { globalTreatmentSectionsKeys } from "@/components/admin/global-treatments/queries";
import { GlobalTreatmentSectionFormDialog } from "@/components/admin/global-treatments/GlobalTreatmentSectionFormDialog";
import type { GlobalTreatmentSection } from "@/types/global-treatment-section";

type GlobalTreatmentSectionsPanelProps = {
  globalTreatmentId: number;
};

/**
 * List + Add/Edit/Delete + reorder, all in one panel — unlike Treatment/
 * Speciality's own sections (which split "ordering" and "manage custom
 * content" across two separate tabs/dialogs to juggle many fixed section
 * kinds alongside custom ones), a global treatment has only ONE kind of
 * section (see the Prisma model's doc comment), so there's no fixed-vs-
 * custom split to manage — one panel is the simpler, equally-valid
 * application of the same underlying primitives (FormDialog, Button,
 * Badge), not a new pattern.
 */
export function GlobalTreatmentSectionsPanel({ globalTreatmentId }: GlobalTreatmentSectionsPanelProps) {
  const queryClient = useQueryClient();
  const [formModal, setFormModal] = useState<{ mode: "create" } | { mode: "edit"; section: GlobalTreatmentSection } | null>(
    null
  );

  const sectionsQuery = useQuery({
    queryKey: globalTreatmentSectionsKeys.byGlobalTreatment(globalTreatmentId),
    queryFn: () => listGlobalTreatmentSections(globalTreatmentId),
  });

  const sections = (sectionsQuery.data?.sections ?? []).slice().sort((a, b) => a.section_order - b.section_order);

  const deleteMutation = useMutation({
    mutationFn: (sectionId: number) => deleteGlobalTreatmentSection(globalTreatmentId, sectionId),
    onSuccess: () => {
      notify.success("Content section deleted.");
      queryClient.invalidateQueries({ queryKey: globalTreatmentSectionsKeys.byGlobalTreatment(globalTreatmentId) });
    },
    onError: (error) => notify.apiError(error),
  });

  const reorderMutation = useMutation({
    mutationFn: (order: { id: number; section_order: number }[]) =>
      reorderGlobalTreatmentSections(globalTreatmentId, { order }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: globalTreatmentSectionsKeys.byGlobalTreatment(globalTreatmentId) });
    },
    onError: (error) => notify.apiError(error),
  });

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;

    const reordered = sections.slice();
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

    reorderMutation.mutate(reordered.map((section, i) => ({ id: section.id, section_order: i })));
  }

  if (sectionsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-body-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading content sections…
      </div>
    );
  }

  if (sectionsQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {sectionsQuery.error instanceof ApiError ? sectionsQuery.error.message : "Failed to load content sections."}
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {sections.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-body-sm text-muted-foreground">
            No content sections yet. Add one to build this global treatment&apos;s page content.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {sections.map((section, index) => (
              <div key={section.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-body font-medium text-foreground">{section.title}</span>
                <Badge variant={section.status === "active" ? "default" : "secondary"} className="shrink-0">
                  {section.status === "active" ? "Active" : "Inactive"}
                </Badge>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={index === 0 || reorderMutation.isPending}
                    onClick={() => move(index, -1)}
                    aria-label="Move up"
                  >
                    <ChevronUp className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={index === sections.length - 1 || reorderMutation.isPending}
                    onClick={() => move(index, 1)}
                    aria-label="Move down"
                  >
                    <ChevronDown className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit content section"
                    onClick={() => setFormModal({ mode: "edit", section })}
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete content section"
                    className="text-destructive hover:text-destructive"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (window.confirm("Delete this content section? This cannot be undone.")) {
                        deleteMutation.mutate(section.id);
                      }
                    }}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setFormModal({ mode: "create" })}>
          <Plus className="size-4" aria-hidden="true" />
          Add Content Section
        </Button>
      </div>

      <GlobalTreatmentSectionFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        section={formModal?.mode === "edit" ? formModal.section : null}
        globalTreatmentId={globalTreatmentId}
        onOpenChange={(open) => !open && setFormModal(null)}
      />
    </>
  );
}
