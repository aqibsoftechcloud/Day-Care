import { prisma } from "@/lib/prisma";
import type {
  CreateLanguageInput,
  UpdateLanguageInput,
} from "@/validators/language.validator";

export class LanguageNotFoundError extends Error {
  constructor(id: number) {
    super(`Language with id ${id} not found`);
    this.name = "LanguageNotFoundError";
  }
}

export function getLanguages() {
  return prisma.languages.findMany({
    orderBy: { id: "asc" },
  });
}

export async function getLanguageById(id: number) {
  const language = await prisma.languages.findUnique({ where: { id } });

  if (!language) {
    throw new LanguageNotFoundError(id);
  }

  return language;
}

export function createLanguage(data: CreateLanguageInput) {
  return prisma.languages.create({ data });
}

export async function updateLanguage(id: number, data: UpdateLanguageInput) {
  await getLanguageById(id);

  return prisma.languages.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
  });
}

/**
 * Soft delete: deactivates the language by setting status to "inactive".
 * Languages are referenced by blogs/cities/doctors/menus/pages/testimonials/
 * treatments/doctor_specialities, so they are never physically removed —
 * matching the same convention already used for modules and users.
 */
export async function deleteLanguage(id: number) {
  await getLanguageById(id);

  await prisma.languages.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
