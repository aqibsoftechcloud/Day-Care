import { apiFetch } from "./client";
import type { CreateLocationInput, Location, UpdateLocationInput } from "@/types/location";

type LocationsListResponse = { success: true; locations: Location[] };
type LocationResponse = { success: true; location: Location };
type DeleteLocationResponse = { success: true; message: string };

/** No pagination/search/filter query params exist on this endpoint (confirmed via services/location.service.ts) — always returns the full list. */
export function listLocations() {
  return apiFetch<LocationsListResponse>("/api/locations");
}

export function getLocation(id: number) {
  return apiFetch<LocationResponse>(`/api/locations/${id}`);
}

export function createLocation(data: CreateLocationInput) {
  return apiFetch<LocationResponse>("/api/locations", { method: "POST", body: data });
}

export function updateLocation(id: number, data: UpdateLocationInput) {
  return apiFetch<LocationResponse>(`/api/locations/${id}`, { method: "PUT", body: data });
}

/** Soft delete — sets status to "inactive" server-side (services/location.service.ts), never removes the row. */
export function deleteLocation(id: number) {
  return apiFetch<DeleteLocationResponse>(`/api/locations/${id}`, { method: "DELETE" });
}
