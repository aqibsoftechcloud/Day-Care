"use server";

import { headers } from "next/headers";
import { getClientIp } from "@/lib/rate-limit";
import { submitConsultationLead } from "@/services/consultation-lead.service";

export type AppointmentLeadState = {
  success: boolean;
  message: string;
  /** Field errors keyed by the configured field key (`full_name`, `phone`, `treatment`, ...). */
  errors?: Record<string, string>;
};

/**
 * Server Action behind the shared consultation form. A thin adapter: all
 * validation, option checking, duplicate handling and persistence happen
 * in `submitConsultationLead` (services/consultation-lead.service.ts) —
 * the same function `POST /api/appointment-leads` uses. The submitted
 * values are a plain object (not a native form post), so the client keeps
 * its own state — and the visitor's input — after any failure.
 */
export async function submitAppointmentLead(values: Record<string, string>): Promise<AppointmentLeadState> {
  if (typeof values !== "object" || values === null) {
    return { success: false, message: "We couldn't read your request. Please try again." };
  }

  try {
    const result = await submitConsultationLead(values, { clientIp: getClientIp(await headers()) });

    if (!result.ok) {
      return { success: false, message: result.message, errors: result.errors };
    }

    return { success: true, message: "Consultation request received. Our team will contact you shortly." };
  } catch (error) {
    console.error("[submitAppointmentLead] Failed to save lead:", error);
    return { success: false, message: "We encountered an issue submitting your request. Please try again." };
  }
}
