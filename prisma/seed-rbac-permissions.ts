/**
 * PROPOSED seed script for RBAC `actions` and `permissions` — NOT YET RUN.
 *
 * This script was written for review as part of "RBAC Authorization +
 * Role Permission" implementation. It is intentionally NOT wired into any
 * Prisma CLI hook, so it will never run automatically. It must be
 * invoked explicitly and only after explicit approval, e.g.:
 *   npx tsx prisma/seed-rbac-permissions.ts
 *
 * What it does:
 * - Upserts 4 rows into `actions` (view, create, update, delete), keyed
 *   by the unique `slug` column — safe to re-run, never duplicates.
 * - Upserts one `permissions` row per (module, action) pair listed below,
 *   keyed by the unique (module_id, action_id) constraint — safe to
 *   re-run, never duplicates.
 *
 * What it deliberately does NOT do:
 * - It does not touch `modules` (already seeded).
 * - It does not touch `role_permissions` — no role is granted anything.
 *   No default super-admin role is created or assigned. This is left
 *   entirely to a separate, explicit action.
 * - It does not modify `users`, `roles`, or any CMS content table.
 * - It does not modify prisma/schema.prisma or run any migration.
 *
 * Module/action coverage below mirrors exactly what
 * `lib/auth/authorization.ts`'s `requirePermission(moduleSlug, actionSlug)`
 * calls were wired into across the controllers in this task. FAQ/Symptom
 * sub-entities (Hospital FAQs, Speciality FAQs, Speciality Symptoms,
 * Treatment FAQs, Treatment Symptoms) have no dedicated `modules` row of
 * their own, so they were folded under their parent module's permission
 * (hospitals / specialities / treatments respectively) — no new module
 * rows are created here to cover them.
 *
 * `insurance-claim-leads` is deliberately excluded: the module row exists,
 * but there is no `insurance_claim_leads` table/model backing it.
 * `modules`, `actions`, and `permissions` management endpoints themselves
 * are deliberately excluded: no RBAC module row exists for meta-RBAC
 * administration.
 *
 * The four Lead Management modules in `VIEW_UPDATE_DELETE_MODULE_SLUGS`
 * get view/update/delete (no create — leads are inbound submissions, never
 * created via the CMS). Update/Delete APIs for these modules do not exist
 * yet; these permission rows exist purely so Super Admin can assign them
 * to roles ahead of that work. As with every other permission here, no
 * `role_permissions` row is created — no role, including Super Admin,
 * is granted these automatically.
 */
import "dotenv/config";
import { prisma } from "../lib/prisma";

const ACTIONS = [
  { name: "View", slug: "view" },
  { name: "Create", slug: "create" },
  { name: "Update", slug: "update" },
  { name: "Delete", slug: "delete" },
] as const;

// Modules that received full view/create/update/delete permissions.
const CRUD_MODULE_SLUGS = [
  "roles",
  "users",
  "languages",
  "cities",
  "locations",
  "banners",
  "menu-management",
  "pages",
  "doctor-pages",
  "hospitals",
  "insurance-companies",
  "specialities",
  "treatments",
  "testimonials",
  "packages",
  "news-and-media",
  "events-and-calendar",
  "gallery",
  "parts",
  "symptoms",
  "articles",
  "doctor-specialities",
  "doctors",
  "blog-categories",
  "blogs",
  "blog-faqs",
  "google-reviews",
  "general-faqs",
  "js-configurations",
  "ai-configurations",
];

// Modules that received view-only permission (read-only lead/data logs).
const VIEW_ONLY_MODULE_SLUGS = ["submissions"];

// Lead Management modules that received view/update/delete permissions —
// deliberately no `create` (these are inbound lead/form submissions, never
// created via the CMS). Super Admin decides per-role which of these get
// granted update/delete through Manage Permissions; nothing here grants
// them automatically.
const VIEW_UPDATE_DELETE_MODULE_SLUGS = [
  "book-an-appointment",
  "feedback-leads",
  "international-patients-leads",
  "book-a-form-data",
];

async function main() {
  const actionsBySlug = new Map<string, { id: number; name: string }>();

  for (const action of ACTIONS) {
    const row = await prisma.actions.upsert({
      where: { slug: action.slug },
      update: { name: action.name },
      create: action,
    });
    actionsBySlug.set(row.slug, row);
  }

  const allModuleSlugs = [
    ...CRUD_MODULE_SLUGS,
    ...VIEW_ONLY_MODULE_SLUGS,
    ...VIEW_UPDATE_DELETE_MODULE_SLUGS,
  ];
  const modules = await prisma.modules.findMany({
    where: { slug: { in: allModuleSlugs } },
    select: { id: true, slug: true, name: true },
  });
  const modulesBySlug = new Map(modules.map((m) => [m.slug, m]));

  const missingModules = allModuleSlugs.filter((slug) => !modulesBySlug.has(slug));
  if (missingModules.length > 0) {
    throw new Error(
      `Aborting: the following module slugs were not found in the database: ${missingModules.join(", ")}`
    );
  }

  let created = 0;
  let updated = 0;

  async function upsertPermission(moduleSlug: string, actionSlug: string) {
    const moduleRow = modulesBySlug.get(moduleSlug)!;
    const actionRow = actionsBySlug.get(actionSlug)!;
    const name = `${moduleRow.name} - ${actionRow.name}`;

    const existing = await prisma.permissions.findUnique({
      where: {
        module_id_action_id: {
          module_id: moduleRow.id,
          action_id: actionRow.id,
        },
      },
    });

    if (existing) {
      if (existing.name !== name) {
        await prisma.permissions.update({
          where: { id: existing.id },
          data: { name },
        });
        updated += 1;
      }
      return;
    }

    await prisma.permissions.create({
      data: { module_id: moduleRow.id, action_id: actionRow.id, name },
    });
    created += 1;
  }

  for (const moduleSlug of CRUD_MODULE_SLUGS) {
    for (const action of ACTIONS) {
      await upsertPermission(moduleSlug, action.slug);
    }
  }

  for (const moduleSlug of VIEW_ONLY_MODULE_SLUGS) {
    await upsertPermission(moduleSlug, "view");
  }

  for (const moduleSlug of VIEW_UPDATE_DELETE_MODULE_SLUGS) {
    for (const actionSlug of ["view", "update", "delete"]) {
      await upsertPermission(moduleSlug, actionSlug);
    }
  }

  console.log(`Actions upserted: ${actionsBySlug.size}`);
  console.log(`Permissions created: ${created}, updated: ${updated}`);
  console.log("No role_permissions rows were created — no role has been granted anything.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
