import { prisma } from "@/lib/prisma";
import type {
  CreateTreatmentFaqInput,
  ListTreatmentFaqsQuery,
  UpdateTreatmentFaqInput,
} from "@/validators/treatment-faq.validator";

export class TreatmentFaqNotFoundError extends Error {
  constructor(id: number) {
    super(`Treatment FAQ with id ${id} not found`);
    this.name = "TreatmentFaqNotFoundError";
  }
}

export class TreatmentNotFoundError extends Error {
  constructor(treatmentId: number) {
    super(`Treatment with id ${treatmentId} not found`);
    this.name = "TreatmentNotFoundError";
  }
}

const treatmentFaqSelect = {
  id: true,
  treatment_id: true,
  title: true,
  text: true,
  status: true,
  created_at: true,
  updated_at: true,
  treatments: {
    select: {
      id: true,
      sub_speciality_name: true,
      sub_speciality_title: true,
      seo_url: true,
    },
  },
} as const;

type TreatmentFaqRecord = {
  id: number;
  treatment_id: number;
  title: string;
  text: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  treatments: {
    id: number;
    sub_speciality_name: string;
    sub_speciality_title: string | null;
    seo_url: string;
  };
};

function toSafeTreatmentFaq(faq: TreatmentFaqRecord) {
  const { treatments, ...rest } = faq;

  return { ...rest, treatment: treatments };
}

async function ensureTreatmentExists(treatmentId: number) {
  const treatment = await prisma.treatments.findUnique({
    where: { id: treatmentId },
  });

  if (!treatment) {
    throw new TreatmentNotFoundError(treatmentId);
  }
}

export async function getTreatmentFaqs(filter?: ListTreatmentFaqsQuery) {
  const faqs = await prisma.treatment_faqs.findMany({
    where: {
      ...(filter?.treatment_id !== undefined
        ? { treatment_id: filter.treatment_id }
        : {}),
      ...(filter?.status !== undefined ? { status: filter.status } : {}),
    },
    select: treatmentFaqSelect,
    orderBy: { id: "asc" },
  });

  return faqs.map(toSafeTreatmentFaq);
}

export async function getTreatmentFaqById(id: number) {
  const faq = await prisma.treatment_faqs.findUnique({
    where: { id },
    select: treatmentFaqSelect,
  });

  if (!faq) {
    throw new TreatmentFaqNotFoundError(id);
  }

  return toSafeTreatmentFaq(faq);
}

export async function createTreatmentFaq(data: CreateTreatmentFaqInput) {
  await ensureTreatmentExists(data.treatment_id);

  const faq = await prisma.treatment_faqs.create({
    data,
    select: treatmentFaqSelect,
  });

  return toSafeTreatmentFaq(faq);
}

export async function updateTreatmentFaq(
  id: number,
  data: UpdateTreatmentFaqInput
) {
  const current = await prisma.treatment_faqs.findUnique({ where: { id } });

  if (!current) {
    throw new TreatmentFaqNotFoundError(id);
  }

  if (data.treatment_id !== undefined) {
    await ensureTreatmentExists(data.treatment_id);
  }

  const faq = await prisma.treatment_faqs.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
    select: treatmentFaqSelect,
  });

  return toSafeTreatmentFaq(faq);
}

/**
 * Soft delete: deactivates the FAQ by setting status to "inactive".
 */
export async function deleteTreatmentFaq(id: number) {
  const current = await prisma.treatment_faqs.findUnique({ where: { id } });

  if (!current) {
    throw new TreatmentFaqNotFoundError(id);
  }

  await prisma.treatment_faqs.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
