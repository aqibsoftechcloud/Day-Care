import { prisma } from "@/lib/prisma";
import type {
  CreateGlobalSpecialityFaqInput,
  ListGlobalSpecialityFaqsQuery,
  UpdateGlobalSpecialityFaqInput,
} from "@/validators/global-speciality-faq.validator";

export class GlobalSpecialityFaqNotFoundError extends Error {
  constructor(id: number) {
    super(`Global speciality FAQ with id ${id} not found`);
    this.name = "GlobalSpecialityFaqNotFoundError";
  }
}

export class GlobalSpecialityNotFoundError extends Error {
  constructor(globalSpecialityId: number) {
    super(`Global speciality with id ${globalSpecialityId} not found`);
    this.name = "GlobalSpecialityNotFoundError";
  }
}

const globalSpecialityFaqSelect = {
  id: true,
  global_speciality_id: true,
  title: true,
  text: true,
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

export async function getGlobalSpecialityFaqs(filter?: ListGlobalSpecialityFaqsQuery) {
  return prisma.global_speciality_faqs.findMany({
    where: {
      ...(filter?.global_speciality_id !== undefined ? { global_speciality_id: filter.global_speciality_id } : {}),
      ...(filter?.status !== undefined ? { status: filter.status } : {}),
    },
    select: globalSpecialityFaqSelect,
    orderBy: { id: "asc" },
  });
}

export async function getGlobalSpecialityFaqById(id: number) {
  const row = await prisma.global_speciality_faqs.findUnique({ where: { id }, select: globalSpecialityFaqSelect });

  if (!row) {
    throw new GlobalSpecialityFaqNotFoundError(id);
  }

  return row;
}

export async function createGlobalSpecialityFaq(data: CreateGlobalSpecialityFaqInput) {
  await ensureGlobalSpecialityExists(data.global_speciality_id);

  return prisma.global_speciality_faqs.create({ data, select: globalSpecialityFaqSelect });
}

export async function updateGlobalSpecialityFaq(id: number, data: UpdateGlobalSpecialityFaqInput) {
  const current = await prisma.global_speciality_faqs.findUnique({ where: { id } });

  if (!current) {
    throw new GlobalSpecialityFaqNotFoundError(id);
  }

  if (data.global_speciality_id !== undefined) {
    await ensureGlobalSpecialityExists(data.global_speciality_id);
  }

  return prisma.global_speciality_faqs.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
    select: globalSpecialityFaqSelect,
  });
}

export async function deleteGlobalSpecialityFaq(id: number) {
  const current = await prisma.global_speciality_faqs.findUnique({ where: { id } });

  if (!current) {
    throw new GlobalSpecialityFaqNotFoundError(id);
  }

  await prisma.global_speciality_faqs.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
