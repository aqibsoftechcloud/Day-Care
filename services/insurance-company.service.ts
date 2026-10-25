import { prisma } from "@/lib/prisma";
import { storageProvider } from "@/lib/storage";
import type {
  CreateInsuranceCompanyInput,
  ListInsuranceCompaniesQuery,
  UpdateInsuranceCompanyInput,
} from "@/validators/insurance-company.validator";

export class InsuranceCompanyNotFoundError extends Error {
  constructor(id: number) {
    super(`Insurance company with id ${id} not found`);
    this.name = "InsuranceCompanyNotFoundError";
  }
}

export class InsuranceCompanyInUseError extends Error {
  constructor(id: number, mappingCount: number) {
    super(`Insurance company with id ${id} is still assigned to ${mappingCount} hospital(s) and cannot be deleted.`);
    this.name = "InsuranceCompanyInUseError";
  }
}

export type InsuranceCompanyImageInput = { buffer: Buffer; mimeType: string };

const INSURANCE_COMPANY_UPLOAD_FOLDER = "insurance-companies";

const insuranceCompanySelect = {
  id: true,
  name: true,
  seo_url: true,
  logo: true,
  description: true,
  status: true,
  created_at: true,
  updated_at: true,
} as const;

export function getInsuranceCompanies(filter?: ListInsuranceCompaniesQuery) {
  return prisma.insurance_companies.findMany({
    where: {
      ...(filter?.status !== undefined ? { status: filter.status } : {}),
      ...(filter?.search !== undefined ? { name: { contains: filter.search } } : {}),
    },
    select: insuranceCompanySelect,
    orderBy: { name: "asc" },
  });
}

export async function getInsuranceCompanyById(id: number) {
  const insuranceCompany = await prisma.insurance_companies.findUnique({
    where: { id },
    select: insuranceCompanySelect,
  });

  if (!insuranceCompany) {
    throw new InsuranceCompanyNotFoundError(id);
  }

  return insuranceCompany;
}

/** Public lookup — only active companies, never throws. Mirrors `getHospitalBySeoUrl`'s "active-only, null not throw" convention, though public rendering here goes through the hospital mapping, not a direct seo_url route. */
export function getActiveInsuranceCompanies() {
  return prisma.insurance_companies.findMany({
    where: { status: "active" },
    select: insuranceCompanySelect,
    orderBy: { name: "asc" },
  });
}

export async function createInsuranceCompany(data: CreateInsuranceCompanyInput, image?: InsuranceCompanyImageInput) {
  const imagePath = image ? await storageProvider.upload(image, INSURANCE_COMPANY_UPLOAD_FOLDER) : (data.logo ?? null);

  return prisma.insurance_companies.create({
    data: { ...data, logo: imagePath },
    select: insuranceCompanySelect,
  });
}

/**
 * Same image-replace ordering as `updateTreatment`: a new logo is
 * uploaded first, the DB update only happens after that succeeds, and
 * the OLD logo is deleted only once the DB update has succeeded
 * (best-effort cleanup — a failure there doesn't fail the request). If
 * the DB update itself fails, the newly uploaded file is best-effort
 * cleaned up instead.
 */
export async function updateInsuranceCompany(
  id: number,
  data: UpdateInsuranceCompanyInput,
  image?: InsuranceCompanyImageInput
) {
  const current = await getInsuranceCompanyById(id);

  let newImagePath: string | undefined;
  if (image) {
    newImagePath = await storageProvider.upload(image, INSURANCE_COMPANY_UPLOAD_FOLDER);
  }

  try {
    const insuranceCompany = await prisma.insurance_companies.update({
      where: { id },
      data: {
        ...data,
        ...(newImagePath !== undefined ? { logo: newImagePath } : {}),
        updated_at: new Date(),
      },
      select: insuranceCompanySelect,
    });

    if (newImagePath !== undefined && current.logo) {
      await storageProvider.delete(current.logo).catch((cleanupError) => {
        console.error("Failed to clean up previous insurance company logo after update:", cleanupError);
      });
    }

    return insuranceCompany;
  } catch (error) {
    if (newImagePath !== undefined) {
      await storageProvider.delete(newImagePath).catch((cleanupError) => {
        console.error("Failed to clean up newly uploaded insurance company logo after a failed update:", cleanupError);
      });
    }

    throw error;
  }
}

/** Hard delete — refuses when the company is still mapped to any hospital (the FK constraint on `hospital_insurance_companies.insurance_company_id` would reject it anyway; this gives a clearer error than a raw Prisma constraint failure). */
export async function deleteInsuranceCompany(id: number) {
  const current = await getInsuranceCompanyById(id);

  const mappingCount = await prisma.hospital_insurance_companies.count({ where: { insurance_company_id: id } });
  if (mappingCount > 0) {
    throw new InsuranceCompanyInUseError(id, mappingCount);
  }

  await prisma.insurance_companies.delete({ where: { id } });

  if (current.logo) {
    await storageProvider.delete(current.logo).catch((cleanupError) => {
      console.error("Failed to clean up insurance company logo after delete:", cleanupError);
    });
  }
}
