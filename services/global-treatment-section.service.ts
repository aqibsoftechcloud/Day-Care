import { prisma } from "@/lib/prisma";
import { sanitizeHtmlFields } from "@/lib/sanitize-html.server";
import { storageProvider } from "@/lib/storage";
import type { UploadInput } from "@/lib/storage";
import type {
  CreateGlobalTreatmentSectionInput,
  UpdateGlobalTreatmentSectionInput,
} from "@/validators/global-treatment-section.validator";

export class GlobalTreatmentNotFoundError extends Error {
  constructor(id: number) {
    super(`Global treatment with id ${id} not found`);
    this.name = "GlobalTreatmentNotFoundError";
  }
}

export class GlobalTreatmentSectionNotFoundError extends Error {
  constructor(sectionId: number) {
    super(`Global treatment section with id ${sectionId} not found`);
    this.name = "GlobalTreatmentSectionNotFoundError";
  }
}

const GLOBAL_TREATMENT_SECTION_UPLOAD_FOLDER = "global-treatment-sections";

/** Uploads one image for use as a global treatment section's `image` — mirrors `uploadTreatmentSectionImage`'s exact pattern, own independent storage folder. */
export async function uploadGlobalTreatmentSectionImage(image: UploadInput): Promise<string> {
  return storageProvider.upload(image, GLOBAL_TREATMENT_SECTION_UPLOAD_FOLDER);
}

const sectionSelect = {
  id: true,
  global_treatment_id: true,
  title: true,
  content: true,
  image: true,
  section_order: true,
  status: true,
  created_at: true,
  updated_at: true,
} as const;

async function ensureGlobalTreatmentExists(globalTreatmentId: number) {
  const row = await prisma.global_treatments.findUnique({ where: { id: globalTreatmentId } });

  if (!row) {
    throw new GlobalTreatmentNotFoundError(globalTreatmentId);
  }
}

async function getNextSectionOrder(globalTreatmentId: number): Promise<number> {
  const last = await prisma.global_treatment_sections.findFirst({
    where: { global_treatment_id: globalTreatmentId },
    orderBy: { section_order: "desc" },
    select: { section_order: true },
  });

  return (last?.section_order ?? -1) + 1;
}

export async function getGlobalTreatmentSections(globalTreatmentId: number) {
  await ensureGlobalTreatmentExists(globalTreatmentId);

  return prisma.global_treatment_sections.findMany({
    where: { global_treatment_id: globalTreatmentId },
    select: sectionSelect,
    orderBy: [{ section_order: "asc" }, { id: "asc" }],
  });
}

export async function getGlobalTreatmentSectionById(globalTreatmentId: number, sectionId: number) {
  const section = await prisma.global_treatment_sections.findFirst({
    where: { id: sectionId, global_treatment_id: globalTreatmentId },
    select: sectionSelect,
  });

  if (!section) {
    throw new GlobalTreatmentSectionNotFoundError(sectionId);
  }

  return section;
}

export async function createGlobalTreatmentSection(globalTreatmentId: number, input: CreateGlobalTreatmentSectionInput) {
  const data = sanitizeHtmlFields(input, ["content"]);
  await ensureGlobalTreatmentExists(globalTreatmentId);

  const order = await getNextSectionOrder(globalTreatmentId);

  return prisma.global_treatment_sections.create({
    data: {
      global_treatment_id: globalTreatmentId,
      title: data.title,
      content: data.content ?? null,
      image: data.image ?? null,
      section_order: order,
      status: data.status ?? "active",
    },
    select: sectionSelect,
  });
}

export async function updateGlobalTreatmentSection(
  globalTreatmentId: number,
  sectionId: number,
  input: UpdateGlobalTreatmentSectionInput
) {
  const data = sanitizeHtmlFields(input, ["content"]);
  await getGlobalTreatmentSectionById(globalTreatmentId, sectionId);

  return prisma.global_treatment_sections.update({
    where: { id: sectionId },
    data: { ...data, updated_at: new Date() },
    select: sectionSelect,
  });
}

export async function deleteGlobalTreatmentSection(globalTreatmentId: number, sectionId: number) {
  await getGlobalTreatmentSectionById(globalTreatmentId, sectionId);

  await prisma.global_treatment_sections.delete({ where: { id: sectionId } });
}

/** Bulk-persists a new `section_order` per section id, all in one transaction — same convention as `reorderTreatmentSections`/`reorderHospitalSections`. */
export async function reorderGlobalTreatmentSections(
  globalTreatmentId: number,
  order: { id: number; section_order: number }[]
) {
  await ensureGlobalTreatmentExists(globalTreatmentId);

  const ids = order.map((entry) => entry.id);
  const existing = await prisma.global_treatment_sections.findMany({
    where: { id: { in: ids }, global_treatment_id: globalTreatmentId },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((section) => section.id));
  const missingId = ids.find((id) => !existingIds.has(id));

  if (missingId !== undefined) {
    throw new GlobalTreatmentSectionNotFoundError(missingId);
  }

  await prisma.$transaction(
    order.map((entry) =>
      prisma.global_treatment_sections.update({
        where: { id: entry.id },
        data: { section_order: entry.section_order, updated_at: new Date() },
      })
    )
  );

  return prisma.global_treatment_sections.findMany({
    where: { global_treatment_id: globalTreatmentId },
    select: sectionSelect,
    orderBy: [{ section_order: "asc" }, { id: "asc" }],
  });
}
