/**
 * Seed script for the Day Care CMS module hierarchy.
 *
 * This script is intentionally NOT wired into any Prisma CLI hook (no
 * `migrations.seed` entry in prisma7.config.ts, no package.json `prisma.seed`
 * field), so it will never run automatically as a side effect of another
 * Prisma command. It must be invoked explicitly, e.g.:
 *   npx tsx prisma/seed-modules.ts
 *
 * It only writes to the existing `modules` table via Prisma Client
 * (upsert by slug, so re-running it is safe and non-duplicating). It never
 * touches prisma/schema.prisma or any other table.
 */
import "dotenv/config";
import { prisma } from "../lib/prisma";

type ModuleSeed = {
  name: string;
  slug: string;
  children?: ModuleSeed[];
};

const MODULE_HIERARCHY: ModuleSeed[] = [
  {
    name: "User Management",
    slug: "user-management",
    children: [
      { name: "Roles", slug: "roles" },
      { name: "Users", slug: "users" },
    ],
  },
  {
    name: "Leads Management",
    slug: "leads-management",
    children: [
      { name: "Book an Appointment", slug: "book-an-appointment" },
      { name: "Feedback Leads", slug: "feedback-leads" },
      {
        name: "International Patients Leads",
        slug: "international-patients-leads",
      },
      { name: "Insurance Claim Leads", slug: "insurance-claim-leads" },
    ],
  },
  {
    name: "Location Management",
    slug: "location-management",
    children: [
      { name: "Cities", slug: "cities" },
      { name: "Locations", slug: "locations" },
    ],
  },
  {
    name: "Content Management",
    slug: "content-management",
    children: [
      { name: "Languages", slug: "languages" },
      { name: "Banners", slug: "banners" },
      { name: "Menu Management", slug: "menu-management" },
      { name: "Pages", slug: "pages" },
      { name: "Doctor Pages", slug: "doctor-pages" },
      { name: "Google Reviews", slug: "google-reviews" },
      { name: "General FAQs", slug: "general-faqs" },
    ],
  },
  {
    name: "Speciality Management",
    slug: "speciality-management",
    children: [{ name: "Specialities", slug: "specialities" }],
  },
  {
    name: "Treatments Management",
    slug: "treatments-management",
    children: [{ name: "Treatments", slug: "treatments" }],
  },
  {
    name: "Hospitals Management",
    slug: "hospitals-management",
    children: [
      { name: "Hospitals", slug: "hospitals" },
      { name: "Insurance Companies", slug: "insurance-companies" },
    ],
  },
  {
    name: "Doctor Management",
    slug: "doctor-management",
    children: [{ name: "Doctors", slug: "doctors" }],
  },
  {
    name: "Doctor Specialities Management",
    slug: "doctor-specialities-management",
    children: [{ name: "Doctor Specialities", slug: "doctor-specialities" }],
  },
  {
    name: "Blogs Management",
    slug: "blogs-management",
    children: [
      { name: "Blog Categories", slug: "blog-categories" },
      { name: "Blogs", slug: "blogs" },
      { name: "Blog FAQs", slug: "blog-faqs" },
    ],
  },
  {
    name: "Testimonial Management",
    slug: "testimonial-management",
    children: [{ name: "Testimonials", slug: "testimonials" }],
  },
  {
    name: "Health Check Packages",
    slug: "health-check-packages",
    children: [{ name: "Packages", slug: "packages" }],
  },
  {
    name: "Media Management",
    slug: "media-management",
    children: [
      { name: "News & Media", slug: "news-and-media" },
      { name: "Events & Calendar", slug: "events-and-calendar" },
      { name: "Gallery", slug: "gallery" },
    ],
  },
  {
    name: "Ovulation Calculator",
    slug: "ovulation-calculator",
    children: [{ name: "Submissions", slug: "submissions" }],
  },
  {
    name: "Symptom Checker",
    slug: "symptom-checker",
    children: [
      { name: "Parts", slug: "parts" },
      { name: "Symptoms", slug: "symptoms" },
      { name: "Articles", slug: "articles" },
    ],
  },
  {
    name: "JS Configuration Management",
    slug: "js-configuration-management",
    children: [{ name: "JS Configurations", slug: "js-configurations" }],
  },
  {
    name: "Book-a-Form Data Management",
    slug: "book-a-form-data-management",
    children: [{ name: "Book-a-Form Data", slug: "book-a-form-data" }],
  },
  {
    name: "AI Configuration Management",
    slug: "ai-configuration-management",
    children: [{ name: "AI Configurations", slug: "ai-configurations" }],
  },
];

async function upsertModule(
  seed: { name: string; slug: string },
  parentId: number | null,
  sortingOrder: number
) {
  return prisma.modules.upsert({
    where: { slug: seed.slug },
    update: {
      name: seed.name,
      parent_id: parentId,
      sorting_order: sortingOrder,
      status: "active",
    },
    create: {
      name: seed.name,
      slug: seed.slug,
      parent_id: parentId,
      sorting_order: sortingOrder,
      status: "active",
    },
  });
}

async function main() {
  for (let i = 0; i < MODULE_HIERARCHY.length; i++) {
    const parentSeed = MODULE_HIERARCHY[i];
    const parent = await upsertModule(parentSeed, null, i + 1);

    console.log(`Upserted parent module: ${parent.name} (id: ${parent.id})`);

    const children = parentSeed.children ?? [];

    for (let j = 0; j < children.length; j++) {
      const child = await upsertModule(children[j], parent.id, j + 1);
      console.log(`  Upserted child module: ${child.name} (id: ${child.id})`);
    }
  }
}

main()
  .catch((error) => {
    console.error("Module seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
