import { apiFetch } from "./client";
import type { City, CreateCityInput, UpdateCityInput } from "@/types/city";

type CitiesListResponse = { success: true; cities: City[] };
type CityResponse = { success: true; city: City };
type DeleteCityResponse = { success: true; message: string };

/** No pagination/search/filter query params exist on this endpoint (confirmed via services/city.service.ts) — always returns the full list. */
export function listCities() {
  return apiFetch<CitiesListResponse>("/api/cities");
}

export function getCity(id: number) {
  return apiFetch<CityResponse>(`/api/cities/${id}`);
}

export function createCity(data: CreateCityInput) {
  return apiFetch<CityResponse>("/api/cities", { method: "POST", body: data });
}

export function updateCity(id: number, data: UpdateCityInput) {
  return apiFetch<CityResponse>(`/api/cities/${id}`, { method: "PUT", body: data });
}

/** Soft delete — sets status to "inactive" server-side (services/city.service.ts), never removes the row. */
export function deleteCity(id: number) {
  return apiFetch<DeleteCityResponse>(`/api/cities/${id}`, { method: "DELETE" });
}
