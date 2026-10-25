import { prisma } from "@/lib/prisma";
import { sanitizeSectionPayload } from "@/lib/sanitize-html.server";
import { Prisma } from "@/app/generated/prisma/client";
import { storageProvider } from "@/lib/storage";
import type { UploadInput } from "@/lib/storage";
import { SpecialityNotFoundError } from "@/services/speciality.service";
import {
  ctaSectionContentSchema,
  customSectionContentSchema,
  whyChooseUsSectionContentSchema,
} from "@/validators/speciality-section.validator";
import type {
  CreateSpecialitySectionInput,
  SpecialitySectionType,
  UpdateSpecialitySectionInput,
} from "@/validators/speciality-section.validator";

export { SpecialityNotFoundError };

const SPECIALITY_SECTION_UPLOAD_FOLDER = "speciality-sections";

/**
 * Uploads one image for use inside a custom section's `content` JSON and
 * returns the stored path — same pattern as page-section.service.ts's
 * `uploadPageSectionImage` (its own small endpoint, not bundled into a
 * single-entity multipart request, since a speciality can have any number
 * of custom sections, each with its own optional image).
 */
export async function uploadSpecialitySectionImage(image: UploadInput): Promise<string> {
  return storageProvider.upload(image, SPECIALITY_SECTION_UPLOAD_FOLDER);
}

export class SpecialitySectionNotFoundError extends Error {
  constructor(sectionId: number) {
    super(`Speciality section with id ${sectionId} not found`);
    this.name = "SpecialitySectionNotFoundError";
  }
}

/** Thrown when `content` is sent for a section type with no configurable content (only `cta`, `custom`, and `why_choose_us` have any), or when the content fails its own type's schema. */
export class InvalidSectionContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSectionContentError";
  }
}

/** Thrown if the API is ever asked to delete a fixed/system section — only `custom` rows are deletable. */
export class CannotDeleteFixedSectionError extends Error {
  constructor(sectionType: string) {
    super(`The "${sectionType}" section is a fixed section and cannot be deleted.`);
    this.name = "CannotDeleteFixedSectionError";
  }
}

const sectionSelect = {
  id: true,
  speciality_id: true,
  section_type: true,
  section_order: true,
  status: true,
  content: true,
  created_at: true,
  updated_at: true,
} as const;

/** Keyed by section_type — the only three types with any configurable content. */
const SECTION_CONTENT_SCHEMAS = {
  cta: ctaSectionContentSchema,
  custom: customSectionContentSchema,
  why_choose_us: whyChooseUsSectionContentSchema,
} as const;

/**
 * Default order matches the structure requested for the Speciality
 * Content tab (Hero, Overview, Treatments, Symptoms, Why Choose Us,
 * Doctors, Hospital, FAQs, CTA) — `why_choose_us` sits right after
 * Symptoms, matching where the section rendered historically before it
 * became CMS-configurable. All 9 default to `active`: every one of the
 * original 8 already rendered unconditionally (whenever its own
 * underlying data existed) before this feature existed, and
 * `why_choose_us` itself self-hides publicly while its content is empty
 * (see SpecialityWhyChooseUs.tsx) — so defaulting it to `active` never
 * shows anything until an admin actually fills it in.
 *
 * This is also the complete list of types a fixed-section row can ever
 * have — "custom" is deliberately excluded from this list, since it's
 * never auto-backfilled (an admin explicitly creates each custom section
 * one at a time via createSpecialitySection).
 */
const FIXED_SECTION_TYPES: SpecialitySectionType[] = [
  "hero",
  "overview",
  "treatments",
  "symptoms",
  "why_choose_us",
  "doctors",
  "hospital",
  "faqs",
  "cta",
];

async function ensureSpecialityExists(specialityId: number) {
  const speciality = await prisma.specialities.findUnique({ where: { id: specialityId } });

  if (!speciality) {
    throw new SpecialityNotFoundError(specialityId);
  }
}

/**
 * Every existing section on the speciality, ordered the same way the
 * public renderer reads them — callers needing "the next free slot"
 * reuse this instead of a second query.
 */
async function getNextSectionOrder(specialityId: number): Promise<number> {
  const last = await prisma.speciality_sections.findFirst({
    where: { speciality_id: specialityId },
    orderBy: { section_order: "desc" },
    select: { section_order: true },
  });

  return (last?.section_order ?? -1) + 1;
}

/**
 * Ensures each of the 9 fixed section types has exactly one row for this
 * speciality, then returns every row (fixed + custom) in order — the one
 * function both the admin UI and the public renderer call.
 *
 * There is no DB-level uniqueness on `(speciality_id, section_type)`
 * anymore (removed specifically to allow unlimited `custom` rows), so
 * this function is now the sole guarantee against duplicate fixed-type
 * rows: it reads which fixed types already exist first, and only inserts
 * the ones still missing. Calling this repeatedly for the same speciality
 * is safe and idempotent — after the first call backfills all 9, every
 * later call finds all 9 already present and inserts nothing.
 *
 * A theoretical race (two truly concurrent first-ever reads of a
 * brand-new speciality) could still each decide the same type is missing
 * and both insert it — a known, narrow, low-stakes limitation (documented
 * in the feature's implementation report) rather than something this
 * function defends against with locking, matching this project's existing
 * risk tolerance for this exact scenario (the previous DB-constraint-based
 * version only ever protected against this same race via a retry, not a
 * hard guarantee either).
 */
export async function getOrCreateSpecialitySections(specialityId: number) {
  await ensureSpecialityExists(specialityId);

  const existing = await prisma.speciality_sections.findMany({
    where: { speciality_id: specialityId, section_type: { in: FIXED_SECTION_TYPES } },
    select: { section_type: true },
  });
  const existingTypes = new Set(existing.map((row) => row.section_type));
  const missingTypes = FIXED_SECTION_TYPES.filter((type) => !existingTypes.has(type));

  if (missingTypes.length > 0) {
    // Brand-new speciality (nothing exists yet): every fixed type is
    // "missing" at once, so `FIXED_SECTION_TYPES.indexOf` gives each one
    // its ideal default position with no risk of colliding with an
    // existing row's `section_order`. A speciality that already has SOME
    // fixed rows (e.g. one created before a new fixed type — like
    // `why_choose_us` — was introduced) is different: reusing `indexOf`
    // there could assign a newly-backfilled row the same `section_order`
    // an existing row already has. To avoid that collision, a partial
    // backfill instead appends each missing type after the current max
    // order — preserving every existing row's position exactly, at the
    // cost of the new row not landing in its "ideal" slot until an admin
    // drags it there once via the existing reorder UI.
    const isBrandNewSpeciality = existingTypes.size === 0;
    const nextOrder = isBrandNewSpeciality ? 0 : await getNextSectionOrder(specialityId);

    await prisma.speciality_sections.createMany({
      data: missingTypes.map((section_type, index) => ({
        speciality_id: specialityId,
        section_type,
        section_order: isBrandNewSpeciality ? FIXED_SECTION_TYPES.indexOf(section_type) : nextOrder + index,
        status: "active" as const,
      })),
    });
  }

  return prisma.speciality_sections.findMany({
    where: { speciality_id: specialityId },
    select: sectionSelect,
    orderBy: [{ section_order: "asc" }, { id: "asc" }],
  });
}

export async function getSpecialitySectionById(specialityId: number, sectionId: number) {
  const section = await prisma.speciality_sections.findFirst({
    where: { id: sectionId, speciality_id: specialityId },
    select: sectionSelect,
  });

  if (!section) {
    throw new SpecialitySectionNotFoundError(sectionId);
  }

  return section;
}

/**
 * Always creates a `section_type: "custom"` row — this is the only
 * section-creation endpoint, and it structurally cannot create a fixed
 * type (hero/overview/etc.), since the input schema
 * (createSpecialitySectionSchema) only accepts custom-section content.
 * Appended at the end of the current order by default.
 */
export async function createSpecialitySection(specialityId: number, input: CreateSpecialitySectionInput) {
  const data = sanitizeSectionPayload(input);
  await ensureSpecialityExists(specialityId);

  const order = await getNextSectionOrder(specialityId);

  return prisma.speciality_sections.create({
    data: {
      speciality_id: specialityId,
      section_type: "custom",
      section_order: order,
      status: data.status ?? "active",
      content: data.content as Prisma.InputJsonValue,
    },
    select: sectionSelect,
  });
}

export async function updateSpecialitySection(
  specialityId: number,
  sectionId: number,
  input: UpdateSpecialitySectionInput
) {
  const data = sanitizeSectionPayload(input);
  // Ensures the fixed set exists first — covers a speciality whose
  // sections have never been read (by admin or public) before this call.
  await getOrCreateSpecialitySections(specialityId);

  const current = await getSpecialitySectionById(specialityId, sectionId);

  let content: Prisma.InputJsonValue | undefined;

  if (data.content !== undefined) {
    const schema = SECTION_CONTENT_SCHEMAS[current.section_type as keyof typeof SECTION_CONTENT_SCHEMAS];

    if (!schema) {
      throw new InvalidSectionContentError(`The "${current.section_type}" section has no configurable content.`);
    }

    const parsed = schema.safeParse(data.content);

    if (!parsed.success) {
      throw new InvalidSectionContentError(parsed.error.issues.map((issue) => issue.message).join(", "));
    }

    content = parsed.data as Prisma.InputJsonValue;
  }

  return prisma.speciality_sections.update({
    where: { id: sectionId },
    data: {
      ...(data.section_order !== undefined ? { section_order: data.section_order } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(content !== undefined ? { content } : {}),
      updated_at: new Date(),
    },
    select: sectionSelect,
  });
}

/**
 * Hard delete — a custom section is a lightweight child row with no
 * independent reporting/audit significance, matching
 * page-section.service.ts's identical `deletePageSection` convention.
 * Refuses to delete a fixed/system section (hero/overview/etc.): those
 * are never meant to be removable, only enabled/disabled — deleting one
 * would just get it silently recreated by the next
 * getOrCreateSpecialitySections() call anyway, so refusing outright is
 * more honest than a delete that doesn't really delete.
 */
export async function deleteSpecialitySection(specialityId: number, sectionId: number) {
  const current = await getSpecialitySectionById(specialityId, sectionId);

  if (current.section_type !== "custom") {
    throw new CannotDeleteFixedSectionError(current.section_type);
  }

  await prisma.speciality_sections.delete({ where: { id: sectionId } });
}

/**
 * Bulk-persists a new `section_order` per section id, all in one
 * transaction — id-based (not section_type-based) so it works for
 * fixed AND custom rows alike. Every id must already belong to
 * specialityId — a stray/foreign id fails the whole reorder rather than
 * partially applying it (mirrors reorderPageSections exactly).
 */
export async function reorderSpecialitySections(
  specialityId: number,
  order: { id: number; section_order: number }[]
) {
  await getOrCreateSpecialitySections(specialityId);

  const ids = order.map((entry) => entry.id);
  const existing = await prisma.speciality_sections.findMany({
    where: { id: { in: ids }, speciality_id: specialityId },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((section) => section.id));
  const missingId = ids.find((id) => !existingIds.has(id));

  if (missingId !== undefined) {
    throw new SpecialitySectionNotFoundError(missingId);
  }

  await prisma.$transaction(
    order.map((entry) =>
      prisma.speciality_sections.update({
        where: { id: entry.id },
        data: { section_order: entry.section_order, updated_at: new Date() },
      })
    )
  );

  return prisma.speciality_sections.findMany({
    where: { speciality_id: specialityId },
    select: sectionSelect,
    orderBy: [{ section_order: "asc" }, { id: "asc" }],
  });
}
