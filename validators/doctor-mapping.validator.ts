import { z } from "zod";

export const doctorMappingParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const syncDoctorHospitalsSchema = z.object({
  hospital_ids: z
    .array(z.coerce.number().int().positive())
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "hospital_ids must not contain duplicates",
    }),
});

export const syncDoctorSpecialitiesSchema = z.object({
  doctor_speciality_ids: z
    .array(z.coerce.number().int().positive())
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "doctor_speciality_ids must not contain duplicates",
    }),
});

export type DoctorMappingParam = z.infer<typeof doctorMappingParamSchema>;
export type SyncDoctorHospitalsInput = z.infer<
  typeof syncDoctorHospitalsSchema
>;
export type SyncDoctorSpecialitiesInput = z.infer<
  typeof syncDoctorSpecialitiesSchema
>;
