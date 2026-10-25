import { apiFetch } from "./client";
import type { DoctorMappedHospital, DoctorMappedSpeciality } from "@/types/doctor";

type DoctorHospitalsResponse = { success: true; hospitals: DoctorMappedHospital[] };
type DoctorSpecialitiesResponse = { success: true; doctorSpecialities: DoctorMappedSpeciality[] };

export function getDoctorHospitals(doctorId: number) {
  return apiFetch<DoctorHospitalsResponse>(`/api/doctors/${doctorId}/hospitals`);
}

/** Replaces the doctor's full set of mapped hospitals with `hospitalIds` in one call. */
export function syncDoctorHospitals(doctorId: number, hospitalIds: number[]) {
  return apiFetch<DoctorHospitalsResponse>(`/api/doctors/${doctorId}/hospitals`, {
    method: "PUT",
    body: { hospital_ids: hospitalIds },
  });
}

export function getDoctorSpecialityMappings(doctorId: number) {
  return apiFetch<DoctorSpecialitiesResponse>(`/api/doctors/${doctorId}/specialities`);
}

/** Replaces the doctor's full set of mapped specialities with `doctorSpecialityIds` in one call. */
export function syncDoctorSpecialityMappings(doctorId: number, doctorSpecialityIds: number[]) {
  return apiFetch<DoctorSpecialitiesResponse>(`/api/doctors/${doctorId}/specialities`, {
    method: "PUT",
    body: { doctor_speciality_ids: doctorSpecialityIds },
  });
}
