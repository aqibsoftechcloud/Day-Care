import { z } from "zod";

export const insuranceCompanyStatusSchema = z.enum(["active", "inactive"]);

export const insuranceCompanyIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listInsuranceCompaniesQuerySchema = z.object({
  status: insuranceCompanyStatusSchema.optional(),
  search: z.string().trim().min(1).optional(),
});

export const createInsuranceCompanySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255),
  logo: z.string().trim().max(500).nullable().optional(),
  description: z.string().trim().nullable().optional(),
  status: insuranceCompanyStatusSchema.optional(),
});

export const updateInsuranceCompanySchema = createInsuranceCompanySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateInsuranceCompanyInput = z.infer<typeof createInsuranceCompanySchema>;
export type UpdateInsuranceCompanyInput = z.infer<typeof updateInsuranceCompanySchema>;
export type InsuranceCompanyIdParam = z.infer<typeof insuranceCompanyIdParamSchema>;
export type ListInsuranceCompaniesQuery = z.infer<typeof listInsuranceCompaniesQuerySchema>;
