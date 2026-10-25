import { prisma } from "@/lib/prisma";
import { storageProvider } from "@/lib/storage";
import type {
  CreateTreatmentSymptomInput,
  ListTreatmentSymptomsQuery,
  UpdateTreatmentSymptomInput,
} from "@/validators/treatment-symptom.validator";

export class TreatmentSymptomNotFoundError extends Error {
  constructor(id: number) {
    super(`Treatment symptom with id ${id} not found`);
    this.name = "TreatmentSymptomNotFoundError";
  }
}

export class TreatmentNotFoundError extends Error {
  constructor(treatmentId: number) {
    super(`Treatment with id ${treatmentId} not found`);
    this.name = "TreatmentNotFoundError";
  }
}

export type TreatmentSymptomImageInput = {
  buffer: Buffer;
  mimeType: string;
};

const TREATMENT_SYMPTOM_UPLOAD_FOLDER = "treatment-symptoms";

const treatmentSymptomSelect = {
  id: true,
  treatment_id: true,
  name: true,
  image: true,
  sorting_order: true,
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

type TreatmentSymptomRecord = {
  id: number;
  treatment_id: number;
  name: string;
  image: string | null;
  sorting_order: number;
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

function toSafeTreatmentSymptom(symptom: TreatmentSymptomRecord) {
  const { treatments, ...rest } = symptom;

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

export async function getTreatmentSymptoms(
  filter?: ListTreatmentSymptomsQuery
) {
  const symptoms = await prisma.treatment_symptoms.findMany({
    where: {
      ...(filter?.treatment_id !== undefined
        ? { treatment_id: filter.treatment_id }
        : {}),
      ...(filter?.status !== undefined ? { status: filter.status } : {}),
    },
    select: treatmentSymptomSelect,
    orderBy: [{ sorting_order: "asc" }, { id: "asc" }],
  });

  return symptoms.map(toSafeTreatmentSymptom);
}

export async function getTreatmentSymptomById(id: number) {
  const symptom = await prisma.treatment_symptoms.findUnique({
    where: { id },
    select: treatmentSymptomSelect,
  });

  if (!symptom) {
    throw new TreatmentSymptomNotFoundError(id);
  }

  return toSafeTreatmentSymptom(symptom);
}

export async function createTreatmentSymptom(
  data: CreateTreatmentSymptomInput,
  image?: TreatmentSymptomImageInput
) {
  await ensureTreatmentExists(data.treatment_id);

  const imagePath = image
    ? await storageProvider.upload(image, TREATMENT_SYMPTOM_UPLOAD_FOLDER)
    : null;

  const symptom = await prisma.treatment_symptoms.create({
    data: { ...data, image: imagePath },
    select: treatmentSymptomSelect,
  });

  return toSafeTreatmentSymptom(symptom);
}

/**
 * Update ordering (safer than naive "delete old, then write new"): a new
 * image is uploaded first, then the DB is updated; the OLD image is only
 * deleted once that DB update has succeeded (best-effort — a cleanup
 * failure doesn't fail the request). If the DB update fails, the newly
 * uploaded file is best-effort cleaned up instead.
 *
 * The `image` parameter has three distinct states:
 * - `undefined`: no change — the existing image is preserved.
 * - `null`: an explicit clear — the DB field is set to NULL, and the old
 *   file is deleted (best-effort) only after that update succeeds.
 * - a real file: replace — upload, update, then delete the old file.
 */
export async function updateTreatmentSymptom(
  id: number,
  data: UpdateTreatmentSymptomInput,
  image?: TreatmentSymptomImageInput | null
) {
  const current = await prisma.treatment_symptoms.findUnique({
    where: { id },
  });

  if (!current) {
    throw new TreatmentSymptomNotFoundError(id);
  }

  if (data.treatment_id !== undefined) {
    await ensureTreatmentExists(data.treatment_id);
  }

  let newImagePath: string | null | undefined;

  if (image === null) {
    newImagePath = null;
  } else if (image) {
    newImagePath = await storageProvider.upload(
      image,
      TREATMENT_SYMPTOM_UPLOAD_FOLDER
    );
  }

  try {
    const symptom = await prisma.treatment_symptoms.update({
      where: { id },
      data: {
        ...data,
        ...(newImagePath !== undefined ? { image: newImagePath } : {}),
        updated_at: new Date(),
      },
      select: treatmentSymptomSelect,
    });

    if (newImagePath !== undefined && current.image) {
      await storageProvider
        .delete(current.image)
        .catch((error) =>
          console.error(
            "Failed to delete old treatment symptom image:",
            error
          )
        );
    }

    return toSafeTreatmentSymptom(symptom);
  } catch (error) {
    if (newImagePath) {
      await storageProvider
        .delete(newImagePath)
        .catch((cleanupError) =>
          console.error(
            "Failed to clean up newly uploaded treatment symptom image after a failed update:",
            cleanupError
          )
        );
    }

    throw error;
  }
}

/**
 * Soft delete: deactivates the symptom by setting status to "inactive".
 * The associated image is intentionally preserved (not deleted).
 */
export async function deleteTreatmentSymptom(id: number) {
  const current = await prisma.treatment_symptoms.findUnique({
    where: { id },
  });

  if (!current) {
    throw new TreatmentSymptomNotFoundError(id);
  }

  await prisma.treatment_symptoms.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
