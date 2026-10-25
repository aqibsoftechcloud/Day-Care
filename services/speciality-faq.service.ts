import { prisma } from "@/lib/prisma";
import type {
  CreateSpecialityFaqInput,
  ListSpecialityFaqsQuery,
  UpdateSpecialityFaqInput,
} from "@/validators/speciality-faq.validator";

export class SpecialityFaqNotFoundError extends Error {
  constructor(id: number) {
    super(`Speciality FAQ with id ${id} not found`);
    this.name = "SpecialityFaqNotFoundError";
  }
}

export class SpecialityNotFoundError extends Error {
  constructor(specialityId: number) {
    super(`Speciality with id ${specialityId} not found`);
    this.name = "SpecialityNotFoundError";
  }
}

const specialityFaqSelect = {
  id: true,
  speciality_id: true,
  title: true,
  text: true,
  status: true,
  created_at: true,
  updated_at: true,
  specialities: {
    select: {
      id: true,
      speciality_name: true,
      speciality_title: true,
      seo_url: true,
    },
  },
} as const;

type SpecialityFaqRecord = {
  id: number;
  speciality_id: number;
  title: string;
  text: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  specialities: {
    id: number;
    speciality_name: string;
    speciality_title: string | null;
    seo_url: string;
  };
};

function toSafeSpecialityFaq(faq: SpecialityFaqRecord) {
  const { specialities, ...rest } = faq;

  return { ...rest, speciality: specialities };
}

async function ensureSpecialityExists(specialityId: number) {
  const speciality = await prisma.specialities.findUnique({
    where: { id: specialityId },
  });

  if (!speciality) {
    throw new SpecialityNotFoundError(specialityId);
  }
}

export async function getSpecialityFaqs(filter?: ListSpecialityFaqsQuery) {
  const faqs = await prisma.speciality_faqs.findMany({
    where:
      filter?.speciality_id !== undefined
        ? { speciality_id: filter.speciality_id }
        : undefined,
    select: specialityFaqSelect,
    orderBy: { id: "asc" },
  });

  return faqs.map(toSafeSpecialityFaq);
}

export async function getSpecialityFaqById(id: number) {
  const faq = await prisma.speciality_faqs.findUnique({
    where: { id },
    select: specialityFaqSelect,
  });

  if (!faq) {
    throw new SpecialityFaqNotFoundError(id);
  }

  return toSafeSpecialityFaq(faq);
}

export async function createSpecialityFaq(data: CreateSpecialityFaqInput) {
  await ensureSpecialityExists(data.speciality_id);

  const faq = await prisma.speciality_faqs.create({
    data,
    select: specialityFaqSelect,
  });

  return toSafeSpecialityFaq(faq);
}

export async function updateSpecialityFaq(
  id: number,
  data: UpdateSpecialityFaqInput
) {
  const current = await prisma.speciality_faqs.findUnique({ where: { id } });

  if (!current) {
    throw new SpecialityFaqNotFoundError(id);
  }

  if (data.speciality_id !== undefined) {
    await ensureSpecialityExists(data.speciality_id);
  }

  const faq = await prisma.speciality_faqs.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
    select: specialityFaqSelect,
  });

  return toSafeSpecialityFaq(faq);
}

/**
 * Soft delete: deactivates the FAQ by setting status to "inactive".
 */
export async function deleteSpecialityFaq(id: number) {
  const current = await prisma.speciality_faqs.findUnique({ where: { id } });

  if (!current) {
    throw new SpecialityFaqNotFoundError(id);
  }

  await prisma.speciality_faqs.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
