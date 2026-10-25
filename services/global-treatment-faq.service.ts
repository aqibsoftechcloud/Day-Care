import { prisma } from "@/lib/prisma";
import type {
  CreateGlobalTreatmentFaqInput,
  ListGlobalTreatmentFaqsQuery,
  UpdateGlobalTreatmentFaqInput,
} from "@/validators/global-treatment-faq.validator";

export class GlobalTreatmentFaqNotFoundError extends Error {
  constructor(id: number) {
    super(`Global treatment FAQ with id ${id} not found`);
    this.name = "GlobalTreatmentFaqNotFoundError";
  }
}

export class GlobalTreatmentNotFoundError extends Error {
  constructor(globalTreatmentId: number) {
    super(`Global treatment with id ${globalTreatmentId} not found`);
    this.name = "GlobalTreatmentNotFoundError";
  }
}

const globalTreatmentFaqSelect = {
  id: true,
  global_treatment_id: true,
  title: true,
  text: true,
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

export async function getGlobalTreatmentFaqs(filter?: ListGlobalTreatmentFaqsQuery) {
  return prisma.global_treatment_faqs.findMany({
    where: {
      ...(filter?.global_treatment_id !== undefined ? { global_treatment_id: filter.global_treatment_id } : {}),
      ...(filter?.status !== undefined ? { status: filter.status } : {}),
    },
    select: globalTreatmentFaqSelect,
    orderBy: { id: "asc" },
  });
}

export async function getGlobalTreatmentFaqById(id: number) {
  const row = await prisma.global_treatment_faqs.findUnique({ where: { id }, select: globalTreatmentFaqSelect });

  if (!row) {
    throw new GlobalTreatmentFaqNotFoundError(id);
  }

  return row;
}

export async function createGlobalTreatmentFaq(data: CreateGlobalTreatmentFaqInput) {
  await ensureGlobalTreatmentExists(data.global_treatment_id);

  return prisma.global_treatment_faqs.create({ data, select: globalTreatmentFaqSelect });
}

export async function updateGlobalTreatmentFaq(id: number, data: UpdateGlobalTreatmentFaqInput) {
  const current = await prisma.global_treatment_faqs.findUnique({ where: { id } });

  if (!current) {
    throw new GlobalTreatmentFaqNotFoundError(id);
  }

  if (data.global_treatment_id !== undefined) {
    await ensureGlobalTreatmentExists(data.global_treatment_id);
  }

  return prisma.global_treatment_faqs.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
    select: globalTreatmentFaqSelect,
  });
}

/** Soft delete: deactivates the FAQ by setting status to "inactive" — same convention as `treatment_faqs`/`blog_faqs`. */
export async function deleteGlobalTreatmentFaq(id: number) {
  const current = await prisma.global_treatment_faqs.findUnique({ where: { id } });

  if (!current) {
    throw new GlobalTreatmentFaqNotFoundError(id);
  }

  await prisma.global_treatment_faqs.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
