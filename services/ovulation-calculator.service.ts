import { prisma } from "@/lib/prisma";

export class OvulationCalculatorSubmissionNotFoundError extends Error {
  constructor(id: number) {
    super(`Ovulation calculator submission with id ${id} not found`);
    this.name = "OvulationCalculatorSubmissionNotFoundError";
  }
}

/**
 * `ovulation_calculator` stores lead submissions captured by a public
 * calculator widget (name/email/mobile_number, plus created_at) — it is
 * NOT calculator configuration and NOT computation input data. Confirmed
 * directly against the schema, which has no cycle-length/last-period-date
 * (or any similar) fields, and has no status/updated_at column either —
 * the same shape as appointment_leads/feedback_leads/
 * international_patient_leads elsewhere in this schema.
 *
 * This module is therefore intentionally read-only: no ovulation/
 * fertility calculation logic exists anywhere in this project's actual
 * requirements or schema, so none is invented here. Only stored
 * submissions are exposed, in list and single-record form.
 */
export function getOvulationCalculatorSubmissions() {
  return prisma.ovulation_calculator.findMany({
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
  });
}

export async function getOvulationCalculatorSubmissionById(id: number) {
  const submission = await prisma.ovulation_calculator.findUnique({
    where: { id },
  });

  if (!submission) {
    throw new OvulationCalculatorSubmissionNotFoundError(id);
  }

  return submission;
}
