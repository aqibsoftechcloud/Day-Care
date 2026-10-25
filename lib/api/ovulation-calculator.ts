import { apiFetch } from "./client";
import type { OvulationCalculatorSubmission } from "@/types/ovulation-calculator";

type OvulationCalculatorListResponse = { success: true; submissions: OvulationCalculatorSubmission[] };
type OvulationCalculatorItemResponse = { success: true; submission: OvulationCalculatorSubmission };

/**
 * Read-only module — the backend exposes no query parameters at all
 * (validators/ovulation-calculator.validator.ts's own comment confirms
 * this is deliberate: "There are no supported query parameters"), so no
 * filter argument is accepted here.
 */
export function listOvulationCalculatorSubmissions() {
  return apiFetch<OvulationCalculatorListResponse>("/api/ovulation-calculator");
}

export function getOvulationCalculatorSubmission(id: number) {
  return apiFetch<OvulationCalculatorItemResponse>(`/api/ovulation-calculator/${id}`);
}
