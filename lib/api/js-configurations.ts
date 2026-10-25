import { apiFetch } from "./client";
import type {
  CreateJsConfigurationInput,
  JsConfiguration,
  ListJsConfigurationsFilter,
  UpdateJsConfigurationInput,
} from "@/types/js-configuration";

type JsConfigurationsListResponse = { success: true; jsConfigurations: JsConfiguration[] };
type JsConfigurationResponse = { success: true; jsConfiguration: JsConfiguration };
type DeleteJsConfigurationResponse = { success: true; message: string };

function toQueryString(filter?: ListJsConfigurationsFilter): string {
  if (!filter) return "";
  const params = new URLSearchParams();
  if (filter.config_for !== undefined) params.set("config_for", filter.config_for);
  if (filter.status !== undefined) params.set("status", filter.status);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function listJsConfigurations(filter?: ListJsConfigurationsFilter) {
  return apiFetch<JsConfigurationsListResponse>(`/api/js-configurations${toQueryString(filter)}`);
}

export function getJsConfiguration(id: number) {
  return apiFetch<JsConfigurationResponse>(`/api/js-configurations/${id}`);
}

export function createJsConfiguration(data: CreateJsConfigurationInput) {
  return apiFetch<JsConfigurationResponse>("/api/js-configurations", { method: "POST", body: data });
}

export function updateJsConfiguration(id: number, data: UpdateJsConfigurationInput) {
  return apiFetch<JsConfigurationResponse>(`/api/js-configurations/${id}`, { method: "PUT", body: data });
}

/** Soft delete — sets status to "inactive". Never physically deleted. */
export function deleteJsConfiguration(id: number) {
  return apiFetch<DeleteJsConfigurationResponse>(`/api/js-configurations/${id}`, { method: "DELETE" });
}
