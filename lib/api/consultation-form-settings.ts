import { apiFetch } from "./client";
import type { ConsultationFormSettings } from "@/types/consultation-form-settings";

type ConsultationFormSettingsResponse = { success: true; settings: ConsultationFormSettings };

export function getConsultationFormSettings() {
  return apiFetch<ConsultationFormSettingsResponse>("/api/consultation-form-settings");
}

export function updateConsultationFormSettings(data: ConsultationFormSettings) {
  return apiFetch<ConsultationFormSettingsResponse>("/api/consultation-form-settings", { method: "PUT", body: data });
}
