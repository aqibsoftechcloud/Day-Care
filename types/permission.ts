/** Mirrors services/permission.service.ts's toSafePermission() output — the full permission catalog entry. */
export type PermissionCatalogEntry = {
  id: number;
  module_id: number;
  action_id: number;
  name: string;
  created_at: string;
  module: { id: number; name: string; slug: string };
  action: { id: number; name: string; slug: string };
};

/** Mirrors services/role-permission.service.ts's getRolePermissions() output — one row per permission currently assigned to a role. The nested key is genuinely named `permissions` in the actual backend response (the Prisma relation field name), not a typo. */
export type RolePermissionAssignment = {
  permission_id: number;
  permissions: {
    id: number;
    name: string;
    module_id: number;
    action_id: number;
  };
};
