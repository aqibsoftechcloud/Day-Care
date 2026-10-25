"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileText, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApiError } from "@/lib/api/client";
import {
  deleteGlobalSpecialitySection,
  listGlobalSpecialitySections,
  reorderGlobalSpecialitySections,
} from "@/lib/api/global-speciality-sections";
import { notify } from "@/lib/toast";
import { globalSpecialitySectionsKeys } from "@/components/admin/global-specialities/queries";
import { GlobalSpecialitySectionFormDialog } from "@/components/admin/global-specialities/GlobalSpecialitySectionFormDialog";
import type { GlobalSpecialitySection } from "@/types/global-speciality-section";

type GlobalSpecialitySectionsPanelProps = {
  globalSpecialityId: number;
};

/** Same single-panel list/add/edit/delete/reorder design as `GlobalTreatmentSectionsPanel.tsx` — see that file's doc comment. */
export function GlobalSpecialitySectionsPanel({ globalSpecialityId }: GlobalSpecialitySectionsPanelProps) {
  const queryClient = useQueryClient();
  const [formModal, setFormModal] = useState<{ mode: "create" } | { mode: "edit"; section: GlobalSpecialitySection } | null>(
    null
  );

  const sectionsQuery = useQuery({
    queryKey: globalSpecialitySectionsKeys.byGlobalSpeciality(globalSpecialityId),
    queryFn: () => listGlobalSpecialitySections(globalSpecialityId),
  });

  const sections = (sectionsQuery.data?.sections ?? []).slice().sort((a, b) => a.section_order - b.section_order);

  const deleteMutation = useMutation({
    mutationFn: (sectionId: number) => deleteGlobalSpecialitySection(globalSpecialityId, sectionId),
    onSuccess: () => {
      notify.success("Content section deleted.");
      queryClient.invalidateQueries({ queryKey: globalSpecialitySectionsKeys.byGlobalSpeciality(globalSpecialityId) });
    },
    onError: (error) => notify.apiError(error),
  });

  const reorderMutation = useMutation({
    mutationFn: (order: { id: number; section_order: number }[]) =>
      reorderGlobalSpecialitySections(globalSpecialityId, { order }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: globalSpecialitySectionsKeys.byGlobalSpeciality(globalSpecialityId) });
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
            No content sections yet. Add one to build this global speciality&apos;s page content.
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

      <GlobalSpecialitySectionFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        section={formModal?.mode === "edit" ? formModal.section : null}
        globalSpecialityId={globalSpecialityId}
        onOpenChange={(open) => !open && setFormModal(null)}
      />
    </>
  );
}
