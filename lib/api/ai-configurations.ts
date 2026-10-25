import { apiFetch } from "./client";
import type {
  AIConfiguration,
  CreateAIConfigurationInput,
  UpdateAIConfigurationInput,
} from "@/types/ai-configuration";

type AIConfigurationsListResponse = { success: true; aiConfigurations: AIConfiguration[] };
type AIConfigurationResponse = { success: true; aiConfiguration: AIConfiguration };
type DeleteAIConfigurationResponse = { success: true; message: string };

export function listAIConfigurations() {
  return apiFetch<AIConfigurationsListResponse>("/api/ai-configurations");
}

export function getAIConfiguration(id: number) {
  return apiFetch<AIConfigurationResponse>(`/api/ai-configurations/${id}`);
}

export function createAIConfiguration(data: CreateAIConfigurationInput) {
  return apiFetch<AIConfigurationResponse>("/api/ai-configurations", { method: "POST", body: data });
}

export function updateAIConfiguration(id: number, data: UpdateAIConfigurationInput) {
  return apiFetch<AIConfigurationResponse>(`/api/ai-configurations/${id}`, { method: "PUT", body: data });
}

/**
 * Soft delete — sets status to "inactive" server-side. The backend refuses
 * to delete the currently active configuration (AIConfigurationIsActiveError,
 * HTTP 409) — surfaced verbatim via the existing ApiError message.
 */
export function deleteAIConfiguration(id: number) {
  return apiFetch<DeleteAIConfigurationResponse>(`/api/ai-configurations/${id}`, { method: "DELETE" });
}

/** Activates this configuration and deactivates every other one — server-side, in a single transaction. */
export function activateAIConfiguration(id: number) {
  return apiFetch<AIConfigurationResponse>(`/api/ai-configurations/${id}/activate`, { method: "PUT" });
}
