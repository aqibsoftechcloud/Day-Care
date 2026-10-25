"use client";

import { useState } from "react";
import { Loader2, Stethoscope } from "lucide-react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/admin/FormDialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/admin/LoadingButton";
import { Checkbox } from "@/components/ui/checkbox";
import { ErrorState } from "@/components/ui/ErrorState";
import { DialogFooter } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/client";
import { getDoctorSpecialityMappings, syncDoctorSpecialityMappings } from "@/lib/api/doctor-mappings";
import { listDoctorSpecialities } from "@/lib/api/doctor-specialities";
import { notify } from "@/lib/toast";
import { doctorSpecialityMappingKeys, doctorSpecialityOptionsKeys } from "@/components/admin/doctors/queries";
import type { Doctor } from "@/types/doctor";

type DoctorSpecialitiesMappingDialogProps = {
  doctor: Doctor | null;
  onClose: () => void;
  canEdit: boolean;
};

/** Full-replace "sync" mapping against the doctor_specialities catalog (a separate module gated by "doctor-specialities.view", read here only to populate this picker) — same checkbox-list + single-Save pattern as DoctorHospitalsMappingDialog. */
export function DoctorSpecialitiesMappingDialog({ doctor, onClose, canEdit }: DoctorSpecialitiesMappingDialogProps) {
  return (
    <FormDialog
      open={!!doctor}
      onOpenChange={(open) => !open && onClose()}
      title="Manage Specialities"
      description={doctor ? `Specialities mapped to ${doctor.doctor_name}.` : undefined}
      className="sm:max-w-lg"
    >
      {doctor && <DoctorSpecialitiesMappingBody key={doctor.id} doctor={doctor} onClose={onClose} canEdit={canEdit} />}
    </FormDialog>
  );
}

function DoctorSpecialitiesMappingBody({
  doctor,
  onClose,
  canEdit,
}: {
  doctor: Doctor;
  onClose: () => void;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [initialized, setInitialized] = useState(false);

  const [optionsQuery, mappedQuery] = useQueries({
    queries: [
      { queryKey: doctorSpecialityOptionsKeys.all, queryFn: () => listDoctorSpecialities() },
      { queryKey: doctorSpecialityMappingKeys.byDoctor(doctor.id), queryFn: () => getDoctorSpecialityMappings(doctor.id) },
    ],
  });

  const loading = optionsQuery.isLoading || mappedQuery.isLoading;
  const error = optionsQuery.error ?? mappedQuery.error;

  if (!initialized && mappedQuery.data) {
    setSelectedIds(new Set(mappedQuery.data.doctorSpecialities.map((s) => s.id)));
    setInitialized(true);
  }

  const options = optionsQuery.data?.doctorSpecialities ?? [];

  const toggleSpeciality = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const mutation = useMutation({
    mutationFn: () => syncDoctorSpecialityMappings(doctor.id, [...selectedIds]),
    onSuccess: () => {
      notify.success("Speciality mappings updated successfully.");
      queryClient.invalidateQueries({ queryKey: doctorSpecialityMappingKeys.byDoctor(doctor.id) });
      onClose();
    },
    onError: (err) => {
      notify.apiError(err, "Failed to update speciality mappings.");
    },
  });

  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Loading specialities…
        </div>
      ) : error ? (
        <ErrorState message={error instanceof ApiError ? error.message : "Failed to load specialities."} />
      ) : options.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 py-10 text-center">
          <Stethoscope className="mb-2 size-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-body-sm text-muted-foreground">No doctor specialities found.</p>
        </div>
      ) : (
        <div className="flex max-h-80 flex-col gap-1 overflow-y-auto rounded-lg border border-border p-2">
          {options.map((speciality) => (
            <label
              key={speciality.id}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 hover:bg-muted/50"
            >
              <Checkbox
                checked={selectedIds.has(speciality.id)}
                onCheckedChange={() => toggleSpeciality(speciality.id)}
                disabled={!canEdit}
                aria-label={speciality.speciality_name}
              />
              <span className="text-body-sm text-foreground">{speciality.speciality_name}</span>
            </label>
          ))}
        </div>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        {canEdit && (
          <LoadingButton
            onClick={() => mutation.mutate()}
            disabled={loading || !!error}
            loading={mutation.isPending}
            loadingText="Saving…"
          >
            Save
          </LoadingButton>
        )}
      </DialogFooter>
    </>
  );
}
