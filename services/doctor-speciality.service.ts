import { prisma } from "@/lib/prisma";
import type {
  CreateDoctorSpecialityInput,
  ListDoctorSpecialitiesQuery,
  UpdateDoctorSpecialityInput,
} from "@/validators/doctor-speciality.validator";

export class DoctorSpecialityNotFoundError extends Error {
  constructor(id: number) {
    super(`Doctor speciality with id ${id} not found`);
    this.name = "DoctorSpecialityNotFoundError";
  }
}

export class LanguageNotFoundError extends Error {
  constructor(languageId: number) {
    super(`Language with id ${languageId} not found`);
    this.name = "LanguageNotFoundError";
  }
}

const doctorSpecialitySelect = {
  id: true,
  language_id: true,
  speciality_name: true,
  seo_url: true,
  status: true,
  created_at: true,
  updated_at: true,
  languages: { select: { id: true, name: true, seo_url: true } },
} as const;

type DoctorSpecialityRecord = {
  id: number;
  language_id: number;
  speciality_name: string;
  seo_url: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  languages: { id: number; name: string; seo_url: string };
};

function toSafeDoctorSpeciality(record: DoctorSpecialityRecord) {
  const { languages, ...rest } = record;

  return { ...rest, language: languages };
}

async function ensureLanguageExists(languageId: number) {
  const language = await prisma.languages.findUnique({
    where: { id: languageId },
  });

  if (!language) {
    throw new LanguageNotFoundError(languageId);
  }
}

export async function getDoctorSpecialities(
  filter?: ListDoctorSpecialitiesQuery
) {
  const records = await prisma.doctor_specialities.findMany({
    where: {
      ...(filter?.language_id !== undefined
        ? { language_id: filter.language_id }
        : {}),
      ...(filter?.status !== undefined ? { status: filter.status } : {}),
    },
    select: doctorSpecialitySelect,
    orderBy: { id: "asc" },
  });

  return records.map(toSafeDoctorSpeciality);
}

export async function getDoctorSpecialityById(id: number) {
  const record = await prisma.doctor_specialities.findUnique({
    where: { id },
    select: doctorSpecialitySelect,
  });

  if (!record) {
    throw new DoctorSpecialityNotFoundError(id);
  }

  return toSafeDoctorSpeciality(record);
}

/**
 * Public lookup by `seo_url` — returns the active doctor speciality
 * (a taxonomy facet, distinct from the clinical `specialities` entity),
 * or `null` if none is active with this seo_url (never throws).
 */
export async function getDoctorSpecialityBySeoUrl(seoUrl: string) {
  const record = await prisma.doctor_specialities.findFirst({
    where: { seo_url: seoUrl, status: "active" },
    select: doctorSpecialitySelect,
  });

  return record ? toSafeDoctorSpeciality(record) : null;
}

export async function createDoctorSpeciality(
  data: CreateDoctorSpecialityInput
) {
  await ensureLanguageExists(data.language_id);

  const record = await prisma.doctor_specialities.create({
    data,
    select: doctorSpecialitySelect,
  });

  return toSafeDoctorSpeciality(record);
}

export async function updateDoctorSpeciality(
  id: number,
  data: UpdateDoctorSpecialityInput
) {
  await getDoctorSpecialityById(id);

  if (data.language_id !== undefined) {
    await ensureLanguageExists(data.language_id);
  }

  const record = await prisma.doctor_specialities.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
    select: doctorSpecialitySelect,
  });

  return toSafeDoctorSpeciality(record);
}

/**
 * Soft delete: deactivates the doctor speciality by setting status to
 * "inactive". Never physically deleted. Does not touch
 * doctor_speciality_mappings — that junction is explicitly out of scope
 * for this module and will be handled as part of the Doctors module.
 */
export async function deleteDoctorSpeciality(id: number) {
  await getDoctorSpecialityById(id);

  await prisma.doctor_specialities.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
