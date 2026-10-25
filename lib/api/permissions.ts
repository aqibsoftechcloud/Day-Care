import { apiFetch } from "./client";
import type { PermissionCatalogEntry } from "@/types/permission";

type PermissionsListResponse = {
  success: true;
  permissions: PermissionCatalogEntry[];
};

/** The full permission catalog (all module × action pairs that exist) — used to render the permission matrix's structure, independent of any one role's current assignments. */
export function listPermissionsCatalog() {
  return apiFetch<PermissionsListResponse>("/api/permissions");
}
