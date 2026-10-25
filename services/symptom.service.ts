import { prisma } from "@/lib/prisma";
import type {
  CreateSymptomInput,
  ListSymptomsQuery,
  UpdateSymptomInput,
} from "@/validators/symptom.validator";

export class SymptomNotFoundError extends Error {
  constructor(id: number) {
    super(`Symptom with id ${id} not found`);
    this.name = "SymptomNotFoundError";
  }
}

export class SymptomPartNotFoundError extends Error {
  constructor(partId: number) {
    super(`Symptom part with id ${partId} not found`);
    this.name = "SymptomPartNotFoundError";
  }
}

export class SymptomHasActiveChildrenError extends Error {
  constructor(id: number) {
    super(
      `Symptom with id ${id} has active symptom articles and cannot be deactivated until they are reassigned or deactivated first`
    );
    this.name = "SymptomHasActiveChildrenError";
  }
}

const symptomSelect = {
  id: true,
  part_id: true,
  symptom_name: true,
  status: true,
  created_at: true,
  updated_at: true,
  symptom_parts: { select: { id: true, part_name: true } },
} as const;

type SymptomRecord = {
  id: number;
  part_id: number;
  symptom_name: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  symptom_parts: { id: number; part_name: string };
};

function toSafeSymptom(symptom: SymptomRecord) {
  const { symptom_parts, ...rest } = symptom;

  return { ...rest, part: symptom_parts };
}

async function ensureSymptomPartExists(partId: number) {
  const part = await prisma.symptom_parts.findUnique({
    where: { id: partId },
  });

  if (!part) {
    throw new SymptomPartNotFoundError(partId);
  }
}

async function ensureNoActiveChildren(id: number) {
  const activeArticle = await prisma.symptom_articles.findFirst({
    where: { symptom_id: id, status: "active" },
    select: { id: true },
  });

  if (activeArticle) {
    throw new SymptomHasActiveChildrenError(id);
  }
}

export async function getSymptoms(filter?: ListSymptomsQuery) {
  const symptoms = await prisma.symptoms.findMany({
    where: {
      ...(filter?.part_id !== undefined ? { part_id: filter.part_id } : {}),
      ...(filter?.status !== undefined ? { status: filter.status } : {}),
    },
    select: symptomSelect,
    orderBy: { id: "asc" },
  });

  return symptoms.map(toSafeSymptom);
}

export async function getSymptomById(id: number) {
  const symptom = await prisma.symptoms.findUnique({
    where: { id },
    select: symptomSelect,
  });

  if (!symptom) {
    throw new SymptomNotFoundError(id);
  }

  return toSafeSymptom(symptom);
}

export async function createSymptom(data: CreateSymptomInput) {
  await ensureSymptomPartExists(data.part_id);

  const symptom = await prisma.symptoms.create({
    data,
    select: symptomSelect,
  });

  return toSafeSymptom(symptom);
}

export async function updateSymptom(id: number, data: UpdateSymptomInput) {
  await getSymptomById(id);

  if (data.part_id !== undefined) {
    await ensureSymptomPartExists(data.part_id);
  }

  const symptom = await prisma.symptoms.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
    select: symptomSelect,
  });

  return toSafeSymptom(symptom);
}

/**
 * Soft delete: deactivates the symptom by setting status to "inactive".
 * Refuses to deactivate a symptom that still has active symptom
 * articles — same protection pattern used for symptom_parts.
 */
export async function deleteSymptom(id: number) {
  await getSymptomById(id);
  await ensureNoActiveChildren(id);

  await prisma.symptoms.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
