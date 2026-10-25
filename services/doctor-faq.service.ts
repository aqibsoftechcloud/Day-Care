import { prisma } from "@/lib/prisma";
import type {
  CreateDoctorFaqInput,
  ListDoctorFaqsQuery,
  UpdateDoctorFaqInput,
} from "@/validators/doctor-faq.validator";

export class DoctorFaqNotFoundError extends Error {
  constructor(id: number) {
    super(`Doctor FAQ with id ${id} not found`);
    this.name = "DoctorFaqNotFoundError";
  }
}

export class DoctorNotFoundError extends Error {
  constructor(doctorId: number) {
    super(`Doctor with id ${doctorId} not found`);
    this.name = "DoctorNotFoundError";
  }
}

const doctorFaqSelect = {
  id: true,
  doctor_id: true,
  title: true,
  text: true,
  status: true,
  created_at: true,
  updated_at: true,
  doctors: { select: { id: true, doctor_name: true, seo_url: true } },
} as const;

type DoctorFaqRecord = {
  id: number;
  doctor_id: number;
  title: string;
  text: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  doctors: { id: number; doctor_name: string; seo_url: string };
};

function toSafeDoctorFaq(faq: DoctorFaqRecord) {
  const { doctors, ...rest } = faq;

  return { ...rest, doctor: doctors };
}

async function ensureDoctorExists(doctorId: number) {
  const doctor = await prisma.doctors.findUnique({ where: { id: doctorId } });

  if (!doctor) {
    throw new DoctorNotFoundError(doctorId);
  }
}

export async function getDoctorFaqs(filter?: ListDoctorFaqsQuery) {
  const faqs = await prisma.doctor_faqs.findMany({
    where: filter?.doctor_id !== undefined ? { doctor_id: filter.doctor_id } : undefined,
    select: doctorFaqSelect,
    orderBy: { id: "asc" },
  });

  return faqs.map(toSafeDoctorFaq);
}

export async function getDoctorFaqById(id: number) {
  const faq = await prisma.doctor_faqs.findUnique({
    where: { id },
    select: doctorFaqSelect,
  });

  if (!faq) {
    throw new DoctorFaqNotFoundError(id);
  }

  return toSafeDoctorFaq(faq);
}

export async function createDoctorFaq(data: CreateDoctorFaqInput) {
  await ensureDoctorExists(data.doctor_id);

  const faq = await prisma.doctor_faqs.create({
    data,
    select: doctorFaqSelect,
  });

  return toSafeDoctorFaq(faq);
}

export async function updateDoctorFaq(id: number, data: UpdateDoctorFaqInput) {
  const current = await prisma.doctor_faqs.findUnique({ where: { id } });

  if (!current) {
    throw new DoctorFaqNotFoundError(id);
  }

  if (data.doctor_id !== undefined) {
    await ensureDoctorExists(data.doctor_id);
  }

  const faq = await prisma.doctor_faqs.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
    select: doctorFaqSelect,
  });

  return toSafeDoctorFaq(faq);
}

/**
 * Soft delete: deactivates the FAQ by setting status to "inactive".
 */
export async function deleteDoctorFaq(id: number) {
  const current = await prisma.doctor_faqs.findUnique({ where: { id } });

  if (!current) {
    throw new DoctorFaqNotFoundError(id);
  }

  await prisma.doctor_faqs.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
