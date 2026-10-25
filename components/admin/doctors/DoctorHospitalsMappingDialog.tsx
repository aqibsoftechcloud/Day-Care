"use client";

import { useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/admin/FormDialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/admin/LoadingButton";
import { Checkbox } from "@/components/ui/checkbox";
import { ErrorState } from "@/components/ui/ErrorState";
import { DialogFooter } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/client";
import { getDoctorHospitals, syncDoctorHospitals } from "@/lib/api/doctor-mappings";
import { listHospitals } from "@/lib/api/hospitals";
import { notify } from "@/lib/toast";
import { doctorHospitalMappingKeys } from "@/components/admin/doctors/queries";
import { hospitalsKeys } from "@/components/admin/hospitals/queries";
import type { Doctor } from "@/types/doctor";

type DoctorHospitalsMappingDialogProps = {
  doctor: Doctor | null;
  onClose: () => void;
  canEdit: boolean;
};

/** Full-replace "sync" mapping, modeled on RolePermissionsDialog's checkbox-list + single-Save pattern, simplified to one checkbox column since there's only one relationship here (mapped or not), not an action matrix. */
export function DoctorHospitalsMappingDialog({ doctor, onClose, canEdit }: DoctorHospitalsMappingDialogProps) {
  return (
    <FormDialog
      open={!!doctor}
      onOpenChange={(open) => !open && onClose()}
      title="Manage Hospitals"
      description={doctor ? `Hospitals mapped to ${doctor.doctor_name}.` : undefined}
      className="sm:max-w-lg"
    >
      {doctor && <DoctorHospitalsMappingBody key={doctor.id} doctor={doctor} onClose={onClose} canEdit={canEdit} />}
    </FormDialog>
  );
}

function DoctorHospitalsMappingBody({
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

  const [hospitalsQuery, mappedQuery] = useQueries({
    queries: [
      { queryKey: hospitalsKeys.all, queryFn: () => listHospitals() },
      { queryKey: doctorHospitalMappingKeys.byDoctor(doctor.id), queryFn: () => getDoctorHospitals(doctor.id) },
    ],
  });

  const loading = hospitalsQuery.isLoading || mappedQuery.isLoading;
  const error = hospitalsQuery.error ?? mappedQuery.error;

  // Seed selection from the fetched mapping once — done synchronously in the
  // render body via a guarded flag (same technique as RolePermissionsDialog)
  // so re-renders while the user is toggling checkboxes never clobber their
  // in-progress changes.
  if (!initialized && mappedQuery.data) {
    setSelectedIds(new Set(mappedQuery.data.hospitals.map((h) => h.id)));
    setInitialized(true);
  }

  const hospitals = hospitalsQuery.data?.hospitals ?? [];

  const toggleHospital = (id: number) => {
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
    mutationFn: () => syncDoctorHospitals(doctor.id, [...selectedIds]),
    onSuccess: () => {
      notify.success("Hospital mappings updated successfully.");
      queryClient.invalidateQueries({ queryKey: doctorHospitalMappingKeys.byDoctor(doctor.id) });
      onClose();
    },
    onError: (err) => {
      notify.apiError(err, "Failed to update hospital mappings.");
    },
  });

  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Loading hospitals…
        </div>
      ) : error ? (
        <ErrorState message={error instanceof ApiError ? error.message : "Failed to load hospitals."} />
      ) : hospitals.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 py-10 text-center">
          <Building2 className="mb-2 size-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-body-sm text-muted-foreground">No hospitals found.</p>
        </div>
      ) : (
        <div className="flex max-h-80 flex-col gap-1 overflow-y-auto rounded-lg border border-border p-2">
          {hospitals.map((hospital) => (
            <label
              key={hospital.id}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 hover:bg-muted/50"
            >
              <Checkbox
                checked={selectedIds.has(hospital.id)}
                onCheckedChange={() => toggleHospital(hospital.id)}
                disabled={!canEdit}
                aria-label={hospital.hospital_name}
              />
              <span className="text-body-sm text-foreground">{hospital.hospital_name}</span>
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
