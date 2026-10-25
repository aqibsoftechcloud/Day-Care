import { prisma } from "@/lib/prisma";
import type {
  ListAppointmentLeadsQuery,
  UpdateAppointmentLeadInput,
} from "@/validators/appointment-lead.validator";

export class AppointmentLeadNotFoundError extends Error {
  constructor(id: number) {
    super(`Appointment lead with id ${id} not found`);
    this.name = "AppointmentLeadNotFoundError";
  }
}

const appointmentLeadSelect = {
  id: true,
  first_name: true,
  last_name: true,
  email: true,
  phone_number: true,
  city_id: true,
  treatment_id: true,
  global_treatment_id: true,
  extra_data: true,
  created_at: true,
  updated_at: true,
} as const;

// Creation lives in services/consultation-lead.service.ts
// (`submitConsultationLead`) — the one canonical, config-validated path for
// both the page form and the public API. This file is the admin read/update/delete side.

export async function getAppointmentLeads(
  filter?: ListAppointmentLeadsQuery
) {
  return prisma.appointment_leads.findMany({
    where: {
      deleted_at: null,
      ...(filter?.email !== undefined ? { email: filter.email } : {}),
    },
    select: appointmentLeadSelect,
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
  });
}

export async function getAppointmentLeadById(id: number) {
  const lead = await prisma.appointment_leads.findUnique({
    where: { id },
    select: appointmentLeadSelect,
  });

  if (!lead) {
    throw new AppointmentLeadNotFoundError(id);
  }

  return lead;
}

export async function updateAppointmentLead(
  id: number,
  data: UpdateAppointmentLeadInput
) {
  await getAppointmentLeadById(id);

  return prisma.appointment_leads.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
    select: appointmentLeadSelect,
  });
}

/**
 * Soft delete: this table has no status column, so a nullable `deleted_at`
 * timestamp was added specifically for this (see prisma/schema.prisma) —
 * the row is never physically removed, and getAppointmentLeads() above
 * excludes anything with deleted_at set.
 */
export async function deleteAppointmentLead(id: number) {
  await getAppointmentLeadById(id);

  await prisma.appointment_leads.update({
    where: { id },
    data: { deleted_at: new Date(), updated_at: new Date() },
  });
}
