/** Centralized TanStack Query keys for the Roles & Permissions feature. */
export const rolesKeys = {
  all: ["roles"] as const,
  detail: (id: number) => ["roles", id] as const,
  permissions: (id: number) => ["roles", id, "permissions"] as const,
  permissionCatalog: ["permissions", "catalog"] as const,
};
