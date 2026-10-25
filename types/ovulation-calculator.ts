/**
 * Mirrors services/ovulation-calculator.service.ts's raw Prisma return
 * exactly — no select clause, no relations. Confirmed against the schema:
 * `ovulation_calculator` has no status column and no `updated_at` column
 * (only `created_at`), the same lead-capture shape as
 * appointment_leads/feedback_leads/international_patient_leads.
 */
export type OvulationCalculatorSubmission = {
  id: number;
  name: string;
  email: string | null;
  mobile_number: string | null;
  created_at: string;
};
