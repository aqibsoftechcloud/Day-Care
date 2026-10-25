import { apiFetch } from "./client";
import type { CreatePageInput, ListPagesFilter, Page, UpdatePageInput } from "@/types/page";

type PagesListResponse = { success: true; pages: Page[] };
type PageResponse = { success: true; page: Page };
type DeletePageResponse = { success: true; message: string };

function toQueryString(filter?: ListPagesFilter): string {
  if (!filter) return "";
  const params = new URLSearchParams();
  if (filter.city_id !== undefined) params.set("city_id", String(filter.city_id));
  if (filter.scope !== undefined) params.set("scope", filter.scope);
  if (filter.status !== undefined) params.set("status", filter.status);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** `filter` is optional and defaults to the full list — the Pages admin table's own no-arg call continues to work unchanged. */
export function listPages(filter?: ListPagesFilter) {
  return apiFetch<PagesListResponse>(`/api/pages${toQueryString(filter)}`);
}

export function getPage(id: number) {
  return apiFetch<PageResponse>(`/api/pages/${id}`);
}

export function createPage(data: CreatePageInput) {
  return apiFetch<PageResponse>("/api/pages", { method: "POST", body: data });
}

export function updatePage(id: number, data: UpdatePageInput) {
  return apiFetch<PageResponse>(`/api/pages/${id}`, { method: "PUT", body: data });
}

/** Soft delete — sets status to "inactive" server-side. */
export function deletePage(id: number) {
  return apiFetch<DeletePageResponse>(`/api/pages/${id}`, { method: "DELETE" });
}
