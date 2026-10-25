/**
 * One-off seed script adding the "Website Content Management" parent
 * module and its "Homepage Icons" child, plus `view`/`update`
 * permissions for it.
 *
 * This script is intentionally NOT wired into any Prisma CLI hook, same
 * convention as seed-modules.ts/seed-rbac-permissions.ts — it must be
 * invoked explicitly:
 *   npx tsx prisma/seed-homepage-icons-module.ts
 *
 * Mirrors the exact pattern already used for "Website Appearance
 * Management"/"Website Appearance" and "Consultation Form Settings
 * Management"/"Consultation Form Settings" (both confirmed, via a direct
 * query, to be live `modules` rows that neither seed-modules.ts nor
 * seed-rbac-permissions.ts actually seeds — i.e. both were added the
 * same ad-hoc, explicitly-run way this script follows, rather than by
 * editing those two now-stale files).
 *
 * Safe to re-run (upserts by slug / the unique (module_id, action_id)
 * constraint). Does not touch `role_permissions` — no role is granted
 * anything by this script; a Super Admin still needs
 * bootstrap-super-admin-permissions.ts re-run (or the new permissions
 * granted via Roles → Manage Permissions) to actually use this module.
 */
import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const maxOrder = await prisma.modules.aggregate({ _max: { sorting_order: true }, where: { parent_id: null } });
  const nextOrder = (maxOrder._max.sorting_order ?? 0) + 1;

  const parent = await prisma.modules.upsert({
    where: { slug: "website-content-management" },
    update: { name: "Website Content Management", parent_id: null, status: "active" },
    create: {
      name: "Website Content Management",
      slug: "website-content-management",
      parent_id: null,
      sorting_order: nextOrder,
      status: "active",
    },
  });
  console.log("parent module:", parent.id, parent.name);

  const child = await prisma.modules.upsert({
    where: { slug: "homepage-icons" },
    update: { name: "Homepage Icons", parent_id: parent.id, status: "active" },
    create: {
      name: "Homepage Icons",
      slug: "homepage-icons",
      parent_id: parent.id,
      sorting_order: 1,
      status: "active",
    },
  });
  console.log("child module:", child.id, child.name);

  const actions = await prisma.actions.findMany({ where: { slug: { in: ["view", "update"] } } });
  const actionsBySlug = new Map(actions.map((a) => [a.slug, a]));

  for (const actionSlug of ["view", "update"]) {
    const action = actionsBySlug.get(actionSlug);
    if (!action) throw new Error(`action "${actionSlug}" not found`);

    const name = `${child.name} - ${action.name}`;
    const existing = await prisma.permissions.findUnique({
      where: { module_id_action_id: { module_id: child.id, action_id: action.id } },
    });

    if (existing) {
      if (existing.name !== name) {
        await prisma.permissions.update({ where: { id: existing.id }, data: { name } });
      }
      console.log("permission exists:", name);
    } else {
      const created = await prisma.permissions.create({ data: { module_id: child.id, action_id: action.id, name } });
      console.log("permission created:", created.id, name);
    }
  }
}

main()
  .catch((error) => {
    console.error("Homepage Icons module seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
