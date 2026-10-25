import { apiFetch } from "./client";
import type { CreateMenuInput, ListMenusFilter, Menu, UpdateMenuInput } from "@/types/menu";

type MenusListResponse = { success: true; menus: Menu[] };
type MenuResponse = { success: true; menu: Menu };
type DeleteMenuResponse = { success: true; message: string };

function toQueryString(filter?: ListMenusFilter): string {
  if (!filter) return "";
  const params = new URLSearchParams();
  if (filter.status !== undefined) params.set("status", filter.status);
  if (filter.language_id !== undefined) params.set("language_id", String(filter.language_id));
  if (filter.city_id !== undefined) params.set("city_id", String(filter.city_id));
  if (filter.cityIdIsNull) params.set("cityIdIsNull", "true");
  if (filter.parent_id !== undefined) params.set("parent_id", String(filter.parent_id));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** `filter` is optional and defaults to the full list — every existing no-arg call site (Parent Menu dropdown, etc.) keeps working unchanged. */
export function listMenus(filter?: ListMenusFilter) {
  return apiFetch<MenusListResponse>(`/api/menus${toQueryString(filter)}`);
}

export function getMenu(id: number) {
  return apiFetch<MenuResponse>(`/api/menus/${id}`);
}

export function createMenu(data: CreateMenuInput) {
  return apiFetch<MenuResponse>("/api/menus", { method: "POST", body: data });
}

export function updateMenu(id: number, data: UpdateMenuInput) {
  return apiFetch<MenuResponse>(`/api/menus/${id}`, { method: "PUT", body: data });
}

/**
 * Soft delete — sets status to "inactive" server-side. The backend
 * refuses to deactivate a menu that still has active children
 * (MenuHasActiveChildrenError, HTTP 409) — surfaced verbatim via the
 * existing ApiError message, not handled specially here.
 */
export function deleteMenu(id: number) {
  return apiFetch<DeleteMenuResponse>(`/api/menus/${id}`, { method: "DELETE" });
}
