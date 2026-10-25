import { prisma } from "@/lib/prisma";
import { sanitizeHtmlFields } from "@/lib/sanitize-html.server";
import { storageProvider } from "@/lib/storage";
import type { UploadInput } from "@/lib/storage";
import type {
  CreateGlobalSpecialitySectionInput,
  UpdateGlobalSpecialitySectionInput,
} from "@/validators/global-speciality-section.validator";

export class GlobalSpecialityNotFoundError extends Error {
  constructor(id: number) {
    super(`Global speciality with id ${id} not found`);
    this.name = "GlobalSpecialityNotFoundError";
  }
}

export class GlobalSpecialitySectionNotFoundError extends Error {
  constructor(sectionId: number) {
    super(`Global speciality section with id ${sectionId} not found`);
    this.name = "GlobalSpecialitySectionNotFoundError";
  }
}

const GLOBAL_SPECIALITY_SECTION_UPLOAD_FOLDER = "global-speciality-sections";

export async function uploadGlobalSpecialitySectionImage(image: UploadInput): Promise<string> {
  return storageProvider.upload(image, GLOBAL_SPECIALITY_SECTION_UPLOAD_FOLDER);
}

const sectionSelect = {
  id: true,
  global_speciality_id: true,
  title: true,
  content: true,
  image: true,
  section_order: true,
  status: true,
  created_at: true,
  updated_at: true,
} as const;

async function ensureGlobalSpecialityExists(globalSpecialityId: number) {
  const row = await prisma.global_specialities.findUnique({ where: { id: globalSpecialityId } });

  if (!row) {
    throw new GlobalSpecialityNotFoundError(globalSpecialityId);
  }
}

async function getNextSectionOrder(globalSpecialityId: number): Promise<number> {
  const last = await prisma.global_speciality_sections.findFirst({
    where: { global_speciality_id: globalSpecialityId },
    orderBy: { section_order: "desc" },
    select: { section_order: true },
  });

  return (last?.section_order ?? -1) + 1;
}

export async function getGlobalSpecialitySections(globalSpecialityId: number) {
  await ensureGlobalSpecialityExists(globalSpecialityId);

  return prisma.global_speciality_sections.findMany({
    where: { global_speciality_id: globalSpecialityId },
    select: sectionSelect,
    orderBy: [{ section_order: "asc" }, { id: "asc" }],
  });
}

export async function getGlobalSpecialitySectionById(globalSpecialityId: number, sectionId: number) {
  const section = await prisma.global_speciality_sections.findFirst({
    where: { id: sectionId, global_speciality_id: globalSpecialityId },
    select: sectionSelect,
  });

  if (!section) {
    throw new GlobalSpecialitySectionNotFoundError(sectionId);
  }

  return section;
}

export async function createGlobalSpecialitySection(
  globalSpecialityId: number,
  input: CreateGlobalSpecialitySectionInput
) {
  const data = sanitizeHtmlFields(input, ["content"]);
  await ensureGlobalSpecialityExists(globalSpecialityId);

  const order = await getNextSectionOrder(globalSpecialityId);

  return prisma.global_speciality_sections.create({
    data: {
      global_speciality_id: globalSpecialityId,
      title: data.title,
      content: data.content ?? null,
      image: data.image ?? null,
      section_order: order,
      status: data.status ?? "active",
    },
    select: sectionSelect,
  });
}

export async function updateGlobalSpecialitySection(
  globalSpecialityId: number,
  sectionId: number,
  input: UpdateGlobalSpecialitySectionInput
) {
  const data = sanitizeHtmlFields(input, ["content"]);
  await getGlobalSpecialitySectionById(globalSpecialityId, sectionId);

  return prisma.global_speciality_sections.update({
    where: { id: sectionId },
    data: { ...data, updated_at: new Date() },
    select: sectionSelect,
  });
}

export async function deleteGlobalSpecialitySection(globalSpecialityId: number, sectionId: number) {
  await getGlobalSpecialitySectionById(globalSpecialityId, sectionId);

  await prisma.global_speciality_sections.delete({ where: { id: sectionId } });
}

export async function reorderGlobalSpecialitySections(
  globalSpecialityId: number,
  order: { id: number; section_order: number }[]
) {
  await ensureGlobalSpecialityExists(globalSpecialityId);

  const ids = order.map((entry) => entry.id);
  const existing = await prisma.global_speciality_sections.findMany({
    where: { id: { in: ids }, global_speciality_id: globalSpecialityId },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((section) => section.id));
  const missingId = ids.find((id) => !existingIds.has(id));

  if (missingId !== undefined) {
    throw new GlobalSpecialitySectionNotFoundError(missingId);
  }

  await prisma.$transaction(
    order.map((entry) =>
      prisma.global_speciality_sections.update({
        where: { id: entry.id },
        data: { section_order: entry.section_order, updated_at: new Date() },
      })
    )
  );

  return prisma.global_speciality_sections.findMany({
    where: { global_speciality_id: globalSpecialityId },
    select: sectionSelect,
    orderBy: [{ section_order: "asc" }, { id: "asc" }],
  });
}
