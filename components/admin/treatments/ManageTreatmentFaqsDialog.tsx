"use client";

import { useState } from "react";
import { Inbox } from "lucide-react";
import { FormDialog } from "@/components/admin/FormDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import { TreatmentFaqsBody } from "@/components/admin/treatments/TreatmentFaqsDialog";
import type { Treatment } from "@/types/treatment";

type ManageTreatmentFaqsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treatments: Treatment[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

/**
 * The header-level "Manage FAQs" entry point — lets the admin pick a
 * treatment first, then reuses TreatmentFaqsBody (the exact same FAQ
 * list/CRUD used by the per-row "FAQs" shortcut) so there is only ever
 * one FAQ management implementation, not two.
 */
export function ManageTreatmentFaqsDialog({
  open,
  onOpenChange,
  treatments,
  canCreate,
  canUpdate,
  canDelete,
}: ManageTreatmentFaqsDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Manage Treatment FAQs"
      description="Select a treatment to manage its FAQs."
      className="sm:max-w-3xl"
    >
      {open && (
        <ManageTreatmentFaqsBody
          treatments={treatments}
          canCreate={canCreate}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />
      )}
    </FormDialog>
  );
}

function ManageTreatmentFaqsBody({
  treatments,
  canCreate,
  canUpdate,
  canDelete,
}: {
  treatments: Treatment[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  // Fresh every time the dialog opens (this whole body unmounts on close,
  // via FormDialog's `{open && ...}` gate above), so re-opening never
  // shows a stale selection from a previous visit.
  const [selectedId, setSelectedId] = useState("");
  const selectedTreatment = treatments.find((treatment) => String(treatment.id) === selectedId) ?? null;

  if (treatments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border px-6 py-14 text-center">
        <span className="mb-2 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Inbox className="size-5" aria-hidden="true" />
        </span>
        <p className="text-subtitle text-foreground">No treatments available</p>
        <p className="mt-1 max-w-sm text-body-sm text-muted-foreground">
          Create a treatment first to manage its FAQs.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="manage-treatment-faqs-select">
          Treatment <span className="text-destructive">*</span>
        </FieldLabel>
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger id="manage-treatment-faqs-select" className="w-full">
            <SelectValue placeholder="Select a treatment" />
          </SelectTrigger>
          <SelectContent>
            {treatments.map((treatment) => (
              <SelectItem key={treatment.id} value={String(treatment.id)}>
                {treatment.sub_speciality_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {selectedTreatment && (
        <>
          <p className="text-body-sm text-muted-foreground">
            Showing FAQs for <span className="font-medium text-foreground">{selectedTreatment.sub_speciality_name}</span>
          </p>
          <TreatmentFaqsBody
            key={selectedTreatment.id}
            treatment={selectedTreatment}
            canCreate={canCreate}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        </>
      )}
    </div>
  );
}
