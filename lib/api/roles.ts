import { apiFetch } from "./client";
import type { CreateRoleInput, Role, UpdateRoleInput } from "@/types/role";
import type { RolePermissionAssignment } from "@/types/permission";

type RolesListResponse = { success: true; roles: Role[] };
type RoleResponse = { success: true; role: Role };
type DeleteRoleResponse = { success: true; message: string };
type RolePermissionsResponse = {
  success: true;
  permissions: RolePermissionAssignment[];
};

export function listRoles() {
  return apiFetch<RolesListResponse>("/api/roles");
}

export function getRole(id: number) {
  return apiFetch<RoleResponse>(`/api/roles/${id}`);
}

export function createRole(data: CreateRoleInput) {
  return apiFetch<RoleResponse>("/api/roles", { method: "POST", body: data });
}

export function updateRole(id: number, data: UpdateRoleInput) {
  return apiFetch<RoleResponse>(`/api/roles/${id}`, {
    method: "PUT",
    body: data,
  });
}

export function deleteRole(id: number) {
  return apiFetch<DeleteRoleResponse>(`/api/roles/${id}`, {
    method: "DELETE",
  });
}

export function getRolePermissions(id: number) {
  return apiFetch<RolePermissionsResponse>(`/api/roles/${id}/permissions`);
}

/** Full-replace sync — matches the backend's actual PUT contract: `{ permission_ids: number[] }`. */
export function syncRolePermissions(id: number, permissionIds: number[]) {
  return apiFetch<RolePermissionsResponse>(`/api/roles/${id}/permissions`, {
    method: "PUT",
    body: { permission_ids: permissionIds },
  });
}
