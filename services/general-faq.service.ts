import { prisma } from "@/lib/prisma";
import type {
  CreateGeneralFaqInput,
  ListGeneralFaqsQuery,
  UpdateGeneralFaqInput,
} from "@/validators/general-faq.validator";

export class GeneralFaqNotFoundError extends Error {
  constructor(id: number) {
    super(`General FAQ with id ${id} not found`);
    this.name = "GeneralFaqNotFoundError";
  }
}

const generalFaqSelect = {
  id: true,
  question: true,
  answer: true,
  status: true,
  created_at: true,
  updated_at: true,
} as const;

export async function getGeneralFaqs(filter?: ListGeneralFaqsQuery) {
  return prisma.general_faqs.findMany({
    where: {
      ...(filter?.status !== undefined ? { status: filter.status } : {}),
    },
    select: generalFaqSelect,
    orderBy: { id: "asc" },
  });
}

export async function getGeneralFaqById(id: number) {
  const faq = await prisma.general_faqs.findUnique({
    where: { id },
    select: generalFaqSelect,
  });

  if (!faq) {
    throw new GeneralFaqNotFoundError(id);
  }

  return faq;
}

export async function createGeneralFaq(data: CreateGeneralFaqInput) {
  return prisma.general_faqs.create({
    data,
    select: generalFaqSelect,
  });
}

export async function updateGeneralFaq(
  id: number,
  data: UpdateGeneralFaqInput
) {
  const current = await prisma.general_faqs.findUnique({ where: { id } });

  if (!current) {
    throw new GeneralFaqNotFoundError(id);
  }

  return prisma.general_faqs.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
    select: generalFaqSelect,
  });
}

/**
 * Soft delete: deactivates the FAQ by setting status to "inactive".
 */
export async function deleteGeneralFaq(id: number) {
  const current = await prisma.general_faqs.findUnique({ where: { id } });

  if (!current) {
    throw new GeneralFaqNotFoundError(id);
  }

  await prisma.general_faqs.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
