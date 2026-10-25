import { z } from "zod";

export const hospitalInsuranceHospitalIdParamSchema = z.object({
  hospitalId: z.coerce.number().int().positive(),
});

export const hospitalInsuranceIdParamSchema = z.object({
  hospitalId: z.coerce.number().int().positive(),
  insuranceCompanyId: z.coerce.number().int().positive(),
});

export const addHospitalInsuranceCompanySchema = z.object({
  insurance_company_id: z.coerce.number().int().positive(),
});

export const reorderHospitalInsuranceCompaniesSchema = z.object({
  order: z
    .array(
      z.object({
        insurance_company_id: z.coerce.number().int().positive(),
        sorting_order: z.coerce.number().int().min(0),
      })
    )
    .min(1, "At least one mapping is required"),
});

export type AddHospitalInsuranceCompanyInput = z.infer<typeof addHospitalInsuranceCompanySchema>;
export type ReorderHospitalInsuranceCompaniesInput = z.infer<typeof reorderHospitalInsuranceCompaniesSchema>;
