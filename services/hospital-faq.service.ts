import { prisma } from "@/lib/prisma";
import type {
  CreateHospitalFaqInput,
  ListHospitalFaqsQuery,
  UpdateHospitalFaqInput,
} from "@/validators/hospital-faq.validator";

export class HospitalFaqNotFoundError extends Error {
  constructor(id: number) {
    super(`Hospital FAQ with id ${id} not found`);
    this.name = "HospitalFaqNotFoundError";
  }
}

export class HospitalNotFoundError extends Error {
  constructor(hospitalId: number) {
    super(`Hospital with id ${hospitalId} not found`);
    this.name = "HospitalNotFoundError";
  }
}

const hospitalFaqSelect = {
  id: true,
  hospital_id: true,
  title: true,
  text: true,
  status: true,
  created_at: true,
  updated_at: true,
  hospitals: { select: { id: true, hospital_name: true, seo_url: true } },
} as const;

type HospitalFaqRecord = {
  id: number;
  hospital_id: number;
  title: string;
  text: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  hospitals: { id: number; hospital_name: string; seo_url: string };
};

function toSafeHospitalFaq(faq: HospitalFaqRecord) {
  const { hospitals, ...rest } = faq;

  return { ...rest, hospital: hospitals };
}

async function ensureHospitalExists(hospitalId: number) {
  const hospital = await prisma.hospitals.findUnique({
    where: { id: hospitalId },
  });

  if (!hospital) {
    throw new HospitalNotFoundError(hospitalId);
  }
}

export async function getHospitalFaqs(filter?: ListHospitalFaqsQuery) {
  const faqs = await prisma.hospital_faqs.findMany({
    where:
      filter?.hospital_id !== undefined
        ? { hospital_id: filter.hospital_id }
        : undefined,
    select: hospitalFaqSelect,
    orderBy: { id: "asc" },
  });

  return faqs.map(toSafeHospitalFaq);
}

export async function getHospitalFaqById(id: number) {
  const faq = await prisma.hospital_faqs.findUnique({
    where: { id },
    select: hospitalFaqSelect,
  });

  if (!faq) {
    throw new HospitalFaqNotFoundError(id);
  }

  return toSafeHospitalFaq(faq);
}

export async function createHospitalFaq(data: CreateHospitalFaqInput) {
  await ensureHospitalExists(data.hospital_id);

  const faq = await prisma.hospital_faqs.create({
    data,
    select: hospitalFaqSelect,
  });

  return toSafeHospitalFaq(faq);
}

export async function updateHospitalFaq(
  id: number,
  data: UpdateHospitalFaqInput
) {
  const current = await prisma.hospital_faqs.findUnique({ where: { id } });

  if (!current) {
    throw new HospitalFaqNotFoundError(id);
  }

  if (data.hospital_id !== undefined) {
    await ensureHospitalExists(data.hospital_id);
  }

  const faq = await prisma.hospital_faqs.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
    select: hospitalFaqSelect,
  });

  return toSafeHospitalFaq(faq);
}

/**
 * Soft delete: deactivates the FAQ by setting status to "inactive".
 */
export async function deleteHospitalFaq(id: number) {
  const current = await prisma.hospital_faqs.findUnique({ where: { id } });

  if (!current) {
    throw new HospitalFaqNotFoundError(id);
  }

  await prisma.hospital_faqs.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
