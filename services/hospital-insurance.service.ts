import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { HospitalNotFoundError } from "@/services/hospital.service";
import { InsuranceCompanyNotFoundError } from "@/services/insurance-company.service";

export { HospitalNotFoundError, InsuranceCompanyNotFoundError };

export class HospitalInsuranceMappingNotFoundError extends Error {
  constructor(hospitalId: number, insuranceCompanyId: number) {
    super(`Hospital ${hospitalId} has no mapping to insurance company ${insuranceCompanyId}`);
    this.name = "HospitalInsuranceMappingNotFoundError";
  }
}

export class DuplicateHospitalInsuranceMappingError extends Error {
  constructor(hospitalId: number, insuranceCompanyId: number) {
    super(`Hospital ${hospitalId} is already mapped to insurance company ${insuranceCompanyId}`);
    this.name = "DuplicateHospitalInsuranceMappingError";
  }
}

const mappingSelect = {
  id: true,
  hospital_id: true,
  insurance_company_id: true,
  sorting_order: true,
  status: true,
  created_at: true,
  updated_at: true,
  insurance_companies: {
    select: { id: true, name: true, seo_url: true, logo: true, description: true, status: true },
  },
} as const;

async function ensureHospitalExists(hospitalId: number) {
  const hospital = await prisma.hospitals.findUnique({ where: { id: hospitalId } });
  if (!hospital) {
    throw new HospitalNotFoundError(hospitalId);
  }
}

async function ensureInsuranceCompanyExists(insuranceCompanyId: number) {
  const insuranceCompany = await prisma.insurance_companies.findUnique({ where: { id: insuranceCompanyId } });
  if (!insuranceCompany) {
    throw new InsuranceCompanyNotFoundError(insuranceCompanyId);
  }
}

/** Every mapping for this hospital (admin view — includes inactive mappings/inactive companies, same "admin sees everything" convention as `getDoctorHospitals`). */
export async function getHospitalInsuranceCompanies(hospitalId: number) {
  await ensureHospitalExists(hospitalId);

  return prisma.hospital_insurance_companies.findMany({
    where: { hospital_id: hospitalId },
    select: mappingSelect,
    orderBy: [{ sorting_order: "asc" }, { id: "asc" }],
  });
}

/** Public-facing variant: only active mappings to active companies — same "admin sees everything, public never does" split as `getActiveDoctorHospitals`. */
export async function getActiveHospitalInsuranceCompanies(hospitalId: number) {
  return prisma.hospital_insurance_companies.findMany({
    where: { hospital_id: hospitalId, status: "active", insurance_companies: { status: "active" } },
    select: mappingSelect,
    orderBy: [{ sorting_order: "asc" }, { id: "asc" }],
  });
}

async function getNextSortingOrder(hospitalId: number): Promise<number> {
  const last = await prisma.hospital_insurance_companies.findFirst({
    where: { hospital_id: hospitalId },
    orderBy: { sorting_order: "desc" },
    select: { sorting_order: true },
  });

  return (last?.sorting_order ?? -1) + 1;
}

export async function addHospitalInsuranceCompany(hospitalId: number, insuranceCompanyId: number) {
  await ensureHospitalExists(hospitalId);
  await ensureInsuranceCompanyExists(insuranceCompanyId);

  const order = await getNextSortingOrder(hospitalId);

  try {
    return await prisma.hospital_insurance_companies.create({
      data: {
        hospital_id: hospitalId,
        insurance_company_id: insuranceCompanyId,
        sorting_order: order,
      },
      select: mappingSelect,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new DuplicateHospitalInsuranceMappingError(hospitalId, insuranceCompanyId);
    }
    throw error;
  }
}

/** Bulk-persists a new `sorting_order` per `insurance_company_id`, all in one transaction. */
export async function reorderHospitalInsuranceCompanies(
  hospitalId: number,
  order: { insurance_company_id: number; sorting_order: number }[]
) {
  await ensureHospitalExists(hospitalId);

  const insuranceCompanyIds = order.map((entry) => entry.insurance_company_id);
  const existing = await prisma.hospital_insurance_companies.findMany({
    where: { hospital_id: hospitalId, insurance_company_id: { in: insuranceCompanyIds } },
    select: { insurance_company_id: true },
  });
  const existingIds = new Set(existing.map((row) => row.insurance_company_id));
  const missingId = insuranceCompanyIds.find((id) => !existingIds.has(id));

  if (missingId !== undefined) {
    throw new HospitalInsuranceMappingNotFoundError(hospitalId, missingId);
  }

  await prisma.$transaction(
    order.map((entry) =>
      prisma.hospital_insurance_companies.update({
        where: { hospital_id_insurance_company_id: { hospital_id: hospitalId, insurance_company_id: entry.insurance_company_id } },
        data: { sorting_order: entry.sorting_order, updated_at: new Date() },
      })
    )
  );

  return getHospitalInsuranceCompanies(hospitalId);
}

export async function removeHospitalInsuranceCompany(hospitalId: number, insuranceCompanyId: number) {
  const existing = await prisma.hospital_insurance_companies.findUnique({
    where: { hospital_id_insurance_company_id: { hospital_id: hospitalId, insurance_company_id: insuranceCompanyId } },
  });

  if (!existing) {
    throw new HospitalInsuranceMappingNotFoundError(hospitalId, insuranceCompanyId);
  }

  await prisma.hospital_insurance_companies.delete({ where: { id: existing.id } });
}
