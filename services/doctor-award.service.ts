import { prisma } from "@/lib/prisma";
import type {
  CreateDoctorAwardInput,
  ListDoctorAwardsQuery,
  UpdateDoctorAwardInput,
} from "@/validators/doctor-award.validator";

export class DoctorAwardNotFoundError extends Error {
  constructor(id: number) {
    super(`Doctor award with id ${id} not found`);
    this.name = "DoctorAwardNotFoundError";
  }
}

export class DoctorNotFoundError extends Error {
  constructor(doctorId: number) {
    super(`Doctor with id ${doctorId} not found`);
    this.name = "DoctorNotFoundError";
  }
}

const doctorAwardSelect = {
  id: true,
  doctor_id: true,
  title: true,
  organization: true,
  award_year: true,
  description: true,
  status: true,
  created_at: true,
  updated_at: true,
  doctors: { select: { id: true, doctor_name: true, seo_url: true } },
} as const;

type DoctorAwardRecord = {
  id: number;
  doctor_id: number;
  title: string;
  organization: string | null;
  award_year: string | null;
  description: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
  doctors: { id: number; doctor_name: string; seo_url: string };
};

function toSafeDoctorAward(award: DoctorAwardRecord) {
  const { doctors, ...rest } = award;

  return { ...rest, doctor: doctors };
}

async function ensureDoctorExists(doctorId: number) {
  const doctor = await prisma.doctors.findUnique({ where: { id: doctorId } });

  if (!doctor) {
    throw new DoctorNotFoundError(doctorId);
  }
}

export async function getDoctorAwards(filter?: ListDoctorAwardsQuery) {
  const awards = await prisma.doctor_awards.findMany({
    where: filter?.doctor_id !== undefined ? { doctor_id: filter.doctor_id } : undefined,
    select: doctorAwardSelect,
    orderBy: { id: "asc" },
  });

  return awards.map(toSafeDoctorAward);
}

export async function getDoctorAwardById(id: number) {
  const award = await prisma.doctor_awards.findUnique({
    where: { id },
    select: doctorAwardSelect,
  });

  if (!award) {
    throw new DoctorAwardNotFoundError(id);
  }

  return toSafeDoctorAward(award);
}

export async function createDoctorAward(data: CreateDoctorAwardInput) {
  await ensureDoctorExists(data.doctor_id);

  const award = await prisma.doctor_awards.create({
    data,
    select: doctorAwardSelect,
  });

  return toSafeDoctorAward(award);
}

export async function updateDoctorAward(id: number, data: UpdateDoctorAwardInput) {
  const current = await prisma.doctor_awards.findUnique({ where: { id } });

  if (!current) {
    throw new DoctorAwardNotFoundError(id);
  }

  if (data.doctor_id !== undefined) {
    await ensureDoctorExists(data.doctor_id);
  }

  const award = await prisma.doctor_awards.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
    select: doctorAwardSelect,
  });

  return toSafeDoctorAward(award);
}

/**
 * Soft delete: deactivates the award by setting status to "inactive".
 */
export async function deleteDoctorAward(id: number) {
  const current = await prisma.doctor_awards.findUnique({ where: { id } });

  if (!current) {
    throw new DoctorAwardNotFoundError(id);
  }

  await prisma.doctor_awards.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
