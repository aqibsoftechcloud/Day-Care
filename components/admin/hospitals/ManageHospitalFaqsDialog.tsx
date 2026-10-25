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
import { HospitalFaqsBody } from "@/components/admin/hospitals/HospitalFaqsDialog";
import type { Hospital } from "@/types/hospital";

type ManageHospitalFaqsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hospitals: Hospital[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

/**
 * The header-level "Manage FAQs" entry point — lets the admin pick a
 * hospital first, then reuses HospitalFaqsBody (the exact same FAQ
 * list/CRUD used by the per-row "FAQs" shortcut) so there is only ever
 * one FAQ management implementation, not two.
 */
export function ManageHospitalFaqsDialog({
  open,
  onOpenChange,
  hospitals,
  canCreate,
  canUpdate,
  canDelete,
}: ManageHospitalFaqsDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Manage Hospital FAQs"
      description="Select a hospital to manage its FAQs."
      className="sm:max-w-3xl"
    >
      {open && (
        <ManageHospitalFaqsBody
          hospitals={hospitals}
          canCreate={canCreate}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />
      )}
    </FormDialog>
  );
}

function ManageHospitalFaqsBody({
  hospitals,
  canCreate,
  canUpdate,
  canDelete,
}: {
  hospitals: Hospital[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  // Fresh every time the dialog opens (this whole body unmounts on close,
  // via FormDialog's `{open && ...}` gate above), so re-opening never
  // shows a stale selection from a previous visit.
  const [selectedId, setSelectedId] = useState("");
  const selectedHospital = hospitals.find((hospital) => String(hospital.id) === selectedId) ?? null;

  if (hospitals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border px-6 py-14 text-center">
        <span className="mb-2 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Inbox className="size-5" aria-hidden="true" />
        </span>
        <p className="text-subtitle text-foreground">No hospitals available</p>
        <p className="mt-1 max-w-sm text-body-sm text-muted-foreground">
          Create a hospital first to manage its FAQs.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="manage-hospital-faqs-select">
          Hospital <span className="text-destructive">*</span>
        </FieldLabel>
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger id="manage-hospital-faqs-select" className="w-full">
            <SelectValue placeholder="Select a hospital" />
          </SelectTrigger>
          <SelectContent>
            {hospitals.map((hospital) => (
              <SelectItem key={hospital.id} value={String(hospital.id)}>
                {hospital.hospital_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {selectedHospital && (
        <>
          <p className="text-body-sm text-muted-foreground">
            Showing FAQs for <span className="font-medium text-foreground">{selectedHospital.hospital_name}</span>
          </p>
          <HospitalFaqsBody
            key={selectedHospital.id}
            hospital={selectedHospital}
            canCreate={canCreate}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        </>
      )}
    </div>
  );
}
