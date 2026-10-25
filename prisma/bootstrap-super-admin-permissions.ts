/**
 * PROPOSED bootstrap script for the Super Admin role — NOT YET RUN.
 *
 * This script was written for review as part of the RBAC bootstrap step.
 * It is intentionally NOT wired into any Prisma CLI hook, so it will
 * never run automatically. It must be invoked explicitly and only after
 * explicit approval, e.g.:
 *   npx tsx prisma/bootstrap-super-admin-permissions.ts
 *
 * What it does:
 * - Grants role id 1 ("Super Admin") every permission currently present
 *   in the `permissions` table (125 rows as of the last seed run), by
 *   calling the EXISTING, already-implemented, already-transactional
 *   `syncRolePermissions()` service (services/role-permission.service.ts)
 *   — the same function that already backs `PUT /api/roles/[id]/permissions`.
 *   No new role_permissions logic is written here; this script only
 *   supplies the input (role id 1, every existing permission id) to
 *   code that already exists and is already covered by this project's
 *   authorization work.
 *
 * What it deliberately does NOT do:
 * - It does not create, modify, or delete any row in `roles`, `users`,
 *   `modules`, `actions`, `permissions`, or any CMS table.
 * - It does not touch passwords or any authentication data.
 * - It does not grant permissions to any role other than id 1.
 * - It does not modify prisma/schema.prisma or run any migration.
 *
 * Idempotency:
 * `syncRolePermissions()` diffs the requested permission id list against
 * the role's CURRENT role_permissions rows: it only inserts ids that are
 * missing (`toAdd`) and only deletes ids that are present but no longer
 * requested (`toRemove`) — both inside a single `prisma.$transaction`.
 * Since this script always requests "every permission that currently
 * exists," running it again after a successful first run computes
 * `toAdd = []` and `toRemove = []` (nothing changes) — a true no-op.
 * Running it before any new permissions are seeded, or after, always
 * converges role 1's permission set to exactly "all permissions that
 * exist at run time" — never more, never fewer, never duplicated (the
 * composite primary key `[role_id, permission_id]` makes a duplicate
 * insert structurally impossible regardless).
 */
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { syncRolePermissions } from "../services/role-permission.service";

const SUPER_ADMIN_ROLE_ID = 1;

async function main() {
  const allPermissions = await prisma.permissions.findMany({
    select: { id: true },
  });
  const permissionIds = allPermissions.map((p) => p.id);

  console.log(
    `Granting role id ${SUPER_ADMIN_ROLE_ID} all ${permissionIds.length} existing permissions...`
  );

  const result = await syncRolePermissions(SUPER_ADMIN_ROLE_ID, {
    permission_ids: permissionIds,
  });

  console.log(`Role ${SUPER_ADMIN_ROLE_ID} now has ${result.length} permissions.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
