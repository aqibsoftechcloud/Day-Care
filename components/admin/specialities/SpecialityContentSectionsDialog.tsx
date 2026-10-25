"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { FormDialog } from "@/components/admin/FormDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApiError } from "@/lib/api/client";
import { deleteSpecialitySection, listSpecialitySections } from "@/lib/api/speciality-sections";
import { notify } from "@/lib/toast";
import { specialitySectionsKey } from "@/components/admin/specialities/SpecialitySectionsPanel";
import { SpecialityContentSectionFormDialog } from "@/components/admin/specialities/SpecialityContentSectionFormDialog";
import type { CustomSectionContent, SpecialitySection } from "@/types/speciality-section";

type SpecialityContentSectionsDialogProps = {
  open: boolean;
  specialityId: number | null;
  specialityName?: string;
  onOpenChange: (open: boolean) => void;
};

/**
 * "Manage Content Sections" — the ONLY place custom sections are
 * created, edited, or deleted (Add/Edit/Delete deliberately do NOT live
 * in the Speciality Content ordering tab, per this feature's explicit
 * UX split). Shares its query cache key with SpecialitySectionsPanel
 * (the ordering tab), so an add/edit/delete here is immediately reflected
 * there without any extra invalidation wiring — one canonical
 * status/order representation, not two.
 *
 * Opens as a dialog stacked on top of the already-open Speciality
 * Create/Edit dialog (triggered by a button on its Basic Information
 * tab) — Radix's Dialog primitive supports this natively.
 */
export function SpecialityContentSectionsDialog({
  open,
  specialityId,
  specialityName,
  onOpenChange,
}: SpecialityContentSectionsDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Manage Content Sections"
      description={specialityName ? `Speciality: ${specialityName}` : undefined}
      className="sm:max-w-2xl"
    >
      {open && specialityId !== null && <SpecialityContentSectionsBody specialityId={specialityId} />}
    </FormDialog>
  );
}

function SpecialityContentSectionsBody({ specialityId }: { specialityId: number }) {
  const queryClient = useQueryClient();
  const [formModal, setFormModal] = useState<{ mode: "create" } | { mode: "edit"; section: SpecialitySection } | null>(
    null
  );

  const sectionsQuery = useQuery({
    queryKey: specialitySectionsKey(specialityId),
    queryFn: () => listSpecialitySections(specialityId),
  });

  const customSections = (sectionsQuery.data?.sections ?? [])
    .filter((section) => section.section_type === "custom")
    .sort((a, b) => a.section_order - b.section_order);

  const deleteMutation = useMutation({
    mutationFn: (sectionId: number) => deleteSpecialitySection(specialityId, sectionId),
    onSuccess: () => {
      notify.success("Content section deleted.");
      queryClient.invalidateQueries({ queryKey: specialitySectionsKey(specialityId) });
    },
    onError: (error) => notify.apiError(error),
  });

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
        {customSections.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-body-sm text-muted-foreground">
            No custom content sections yet. Add one to include extra editorial content on this speciality&apos;s page.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {customSections.map((section) => {
              const content = section.content as CustomSectionContent | null;
              return (
                <div
                  key={section.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
                >
                  <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-body font-medium text-foreground">
                    {content?.title?.trim() || "Untitled custom section"}
                  </span>
                  <Badge variant={section.status === "active" ? "default" : "secondary"} className="shrink-0">
                    {section.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                  <div className="flex shrink-0 items-center gap-1">
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
              );
            })}
          </div>
        )}

        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setFormModal({ mode: "create" })}>
          <Plus className="size-4" aria-hidden="true" />
          Add Content Section
        </Button>
      </div>

      <SpecialityContentSectionFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        section={formModal?.mode === "edit" ? formModal.section : null}
        specialityId={specialityId}
        onOpenChange={(open) => !open && setFormModal(null)}
      />
    </>
  );
}
