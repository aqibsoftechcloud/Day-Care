import { prisma } from "@/lib/prisma";
import { storageProvider } from "@/lib/storage";
import type {
  CreateSpecialitySymptomInput,
  ListSpecialitySymptomsQuery,
  UpdateSpecialitySymptomInput,
} from "@/validators/speciality-symptom.validator";

export class SpecialitySymptomNotFoundError extends Error {
  constructor(id: number) {
    super(`Speciality symptom with id ${id} not found`);
    this.name = "SpecialitySymptomNotFoundError";
  }
}

export class SpecialityNotFoundError extends Error {
  constructor(specialityId: number) {
    super(`Speciality with id ${specialityId} not found`);
    this.name = "SpecialityNotFoundError";
  }
}

export type SpecialitySymptomImageInput = {
  buffer: Buffer;
  mimeType: string;
};

const SPECIALITY_SYMPTOM_UPLOAD_FOLDER = "speciality-symptoms";

const specialitySymptomSelect = {
  id: true,
  speciality_id: true,
  name: true,
  image: true,
  sorting_order: true,
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

type SpecialitySymptomRecord = {
  id: number;
  speciality_id: number;
  name: string;
  image: string | null;
  sorting_order: number;
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

function toSafeSpecialitySymptom(symptom: SpecialitySymptomRecord) {
  const { specialities, ...rest } = symptom;

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

export async function getSpecialitySymptoms(
  filter?: ListSpecialitySymptomsQuery
) {
  const symptoms = await prisma.speciality_symptoms.findMany({
    where: {
      ...(filter?.speciality_id !== undefined
        ? { speciality_id: filter.speciality_id }
        : {}),
      ...(filter?.status !== undefined ? { status: filter.status } : {}),
    },
    select: specialitySymptomSelect,
    orderBy: [{ sorting_order: "asc" }, { id: "asc" }],
  });

  return symptoms.map(toSafeSpecialitySymptom);
}

export async function getSpecialitySymptomById(id: number) {
  const symptom = await prisma.speciality_symptoms.findUnique({
    where: { id },
    select: specialitySymptomSelect,
  });

  if (!symptom) {
    throw new SpecialitySymptomNotFoundError(id);
  }

  return toSafeSpecialitySymptom(symptom);
}

export async function createSpecialitySymptom(
  data: CreateSpecialitySymptomInput,
  image?: SpecialitySymptomImageInput
) {
  await ensureSpecialityExists(data.speciality_id);

  const imagePath = image
    ? await storageProvider.upload(image, SPECIALITY_SYMPTOM_UPLOAD_FOLDER)
    : null;

  const symptom = await prisma.speciality_symptoms.create({
    data: { ...data, image: imagePath },
    select: specialitySymptomSelect,
  });

  return toSafeSpecialitySymptom(symptom);
}

/**
 * Update ordering (deliberately safer than a naive "delete old, then
 * write new"): a new image is uploaded first, then the DB is updated;
 * the OLD image is only deleted once that DB update has succeeded
 * (best-effort — a cleanup failure doesn't fail the request). If the DB
 * update itself fails, the newly uploaded file is best-effort cleaned up
 * instead, so a failed update never leaves an orphaned new file behind
 * nor a record pointing at a deleted image.
 */
export async function updateSpecialitySymptom(
  id: number,
  data: UpdateSpecialitySymptomInput,
  image?: SpecialitySymptomImageInput
) {
  const current = await prisma.speciality_symptoms.findUnique({
    where: { id },
  });

  if (!current) {
    throw new SpecialitySymptomNotFoundError(id);
  }

  if (data.speciality_id !== undefined) {
    await ensureSpecialityExists(data.speciality_id);
  }

  let newImagePath: string | undefined;

  if (image) {
    newImagePath = await storageProvider.upload(
      image,
      SPECIALITY_SYMPTOM_UPLOAD_FOLDER
    );
  }

  try {
    const symptom = await prisma.speciality_symptoms.update({
      where: { id },
      data: {
        ...data,
        ...(newImagePath !== undefined ? { image: newImagePath } : {}),
        updated_at: new Date(),
      },
      select: specialitySymptomSelect,
    });

    if (newImagePath !== undefined && current.image) {
      await storageProvider
        .delete(current.image)
        .catch((error) =>
          console.error(
            "Failed to delete old speciality symptom image:",
            error
          )
        );
    }

    return toSafeSpecialitySymptom(symptom);
  } catch (error) {
    if (newImagePath !== undefined) {
      await storageProvider
        .delete(newImagePath)
        .catch((cleanupError) =>
          console.error(
            "Failed to clean up newly uploaded speciality symptom image after a failed update:",
            cleanupError
          )
        );
    }

    throw error;
  }
}

/**
 * Soft delete: deactivates the symptom by setting status to "inactive".
 * The associated image is intentionally preserved (not deleted), so the
 * symptom can be safely reactivated later without re-uploading it.
 */
export async function deleteSpecialitySymptom(id: number) {
  const current = await prisma.speciality_symptoms.findUnique({
    where: { id },
  });

  if (!current) {
    throw new SpecialitySymptomNotFoundError(id);
  }

  await prisma.speciality_symptoms.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
