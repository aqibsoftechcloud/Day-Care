import { prisma } from "@/lib/prisma";
import { sanitizeHtmlFields } from "@/lib/sanitize-html.server";
import type {
  CreateSymptomPartInput,
  ListSymptomPartsQuery,
  UpdateSymptomPartInput,
} from "@/validators/symptom-part.validator";

export class SymptomPartNotFoundError extends Error {
  constructor(id: number) {
    super(`Symptom part with id ${id} not found`);
    this.name = "SymptomPartNotFoundError";
  }
}

export class SymptomPartHasActiveChildrenError extends Error {
  constructor(id: number) {
    super(
      `Symptom part with id ${id} has active symptoms or symptom articles and cannot be deactivated until they are reassigned or deactivated first`
    );
    this.name = "SymptomPartHasActiveChildrenError";
  }
}

export function getSymptomParts(filter?: ListSymptomPartsQuery) {
  return prisma.symptom_parts.findMany({
    where:
      filter?.status !== undefined ? { status: filter.status } : undefined,
    orderBy: { id: "asc" },
  });
}

export async function getSymptomPartById(id: number) {
  const symptomPart = await prisma.symptom_parts.findUnique({
    where: { id },
  });

  if (!symptomPart) {
    throw new SymptomPartNotFoundError(id);
  }

  return symptomPart;
}

/**
 * Public lookup by `seo_url` — returns the active symptom part, or
 * `null` if none is active with this seo_url (never throws).
 */
export function getSymptomPartBySeoUrl(seoUrl: string) {
  return prisma.symptom_parts.findFirst({
    where: { seo_url: seoUrl, status: "active" },
  });
}

export function createSymptomPart(input: CreateSymptomPartInput) {
  const data = sanitizeHtmlFields(input, ["part_description"]);

  return prisma.symptom_parts.create({ data });
}

export async function updateSymptomPart(
  id: number,
  input: UpdateSymptomPartInput
) {
  const data = sanitizeHtmlFields(input, ["part_description"]);
  await getSymptomPartById(id);

  return prisma.symptom_parts.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
  });
}

async function ensureNoActiveChildren(id: number) {
  const [activeSymptom, activeArticle] = await Promise.all([
    prisma.symptoms.findFirst({
      where: { part_id: id, status: "active" },
      select: { id: true },
    }),
    prisma.symptom_articles.findFirst({
      where: { part_id: id, status: "active" },
      select: { id: true },
    }),
  ]);

  if (activeSymptom || activeArticle) {
    throw new SymptomPartHasActiveChildrenError(id);
  }
}

/**
 * Soft delete: deactivates the part by setting status to "inactive".
 * Refuses to deactivate a part that still has active symptoms or
 * symptom articles, to avoid silently orphaning them — the caller must
 * reassign or deactivate the children first. Mirrors the same
 * protection pattern already used for Menus and Specialities.
 */
export async function deleteSymptomPart(id: number) {
  await getSymptomPartById(id);
  await ensureNoActiveChildren(id);

  await prisma.symptom_parts.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
