"use client";

import { DetailSheet } from "@/components/admin/DetailSheet";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format-date";
import type { DoctorSpeciality } from "@/types/doctor-speciality";

type DoctorSpecialityViewDialogProps = {
  doctorSpeciality: DoctorSpeciality | null;
  onClose: () => void;
};

export function DoctorSpecialityViewDialog({ doctorSpeciality, onClose }: DoctorSpecialityViewDialogProps) {
  if (!doctorSpeciality) return null;

  return (
    <DetailSheet
      open={!!doctorSpeciality}
      onClose={onClose}
      title="Doctor Speciality Details"
      description={doctorSpeciality.speciality_name}
      sections={[
        {
          heading: "Doctor Speciality Information",
          rows: [
            { label: "Speciality Name", value: doctorSpeciality.speciality_name },
            { label: "Language", value: doctorSpeciality.language.name },
            { label: "SEO URL", value: doctorSpeciality.seo_url },
            { label: "Status", value: <StatusBadge status={doctorSpeciality.status} /> },
          ],
        },
        {
          heading: "Timestamps",
          rows: [
            { label: "Created", value: formatDate(doctorSpeciality.created_at) },
            { label: "Updated", value: formatDate(doctorSpeciality.updated_at) },
          ],
        },
      ]}
    />
  );
}
