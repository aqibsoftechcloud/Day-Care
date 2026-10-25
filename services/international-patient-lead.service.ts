import { prisma } from "@/lib/prisma";
import type {
  ListInternationalPatientLeadsQuery,
  UpdateInternationalPatientLeadInput,
} from "@/validators/international-patient-lead.validator";

export class InternationalPatientLeadNotFoundError extends Error {
  constructor(id: number) {
    super(`International patient lead with id ${id} not found`);
    this.name = "InternationalPatientLeadNotFoundError";
  }
}

const internationalPatientLeadSelect = {
  id: true,
  name: true,
  age: true,
  gender: true,
  country: true,
  created_at: true,
  updated_at: true,
} as const;

export async function getInternationalPatientLeads(
  filter?: ListInternationalPatientLeadsQuery
) {
  return prisma.international_patient_leads.findMany({
    where: {
      deleted_at: null,
      ...(filter?.country !== undefined ? { country: filter.country } : {}),
    },
    select: internationalPatientLeadSelect,
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
  });
}

export async function getInternationalPatientLeadById(id: number) {
  const lead = await prisma.international_patient_leads.findUnique({
    where: { id },
    select: internationalPatientLeadSelect,
  });

  if (!lead) {
    throw new InternationalPatientLeadNotFoundError(id);
  }

  return lead;
}

export async function updateInternationalPatientLead(
  id: number,
  data: UpdateInternationalPatientLeadInput
) {
  await getInternationalPatientLeadById(id);

  return prisma.international_patient_leads.update({
    where: { id },
    data: {
      ...data,
      age: data.age ?? null,
      gender: data.gender ?? null,
      country: data.country ?? null,
      updated_at: new Date(),
    },
    select: internationalPatientLeadSelect,
  });
}

/**
 * Soft delete: this table has no status column, so a nullable `deleted_at`
 * timestamp was added specifically for this (see prisma/schema.prisma) —
 * the row is never physically removed, and getInternationalPatientLeads()
 * above excludes anything with deleted_at set.
 */
export async function deleteInternationalPatientLead(id: number) {
  await getInternationalPatientLeadById(id);

  await prisma.international_patient_leads.update({
    where: { id },
    data: { deleted_at: new Date(), updated_at: new Date() },
  });
}
