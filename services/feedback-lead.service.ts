import { prisma } from "@/lib/prisma";
import type {
  ListFeedbackLeadsQuery,
  UpdateFeedbackLeadInput,
} from "@/validators/feedback-lead.validator";

export class FeedbackLeadNotFoundError extends Error {
  constructor(id: number) {
    super(`Feedback lead with id ${id} not found`);
    this.name = "FeedbackLeadNotFoundError";
  }
}

const feedbackLeadSelect = {
  id: true,
  name: true,
  email: true,
  phone_number: true,
  hospital_location: true,
  created_at: true,
  updated_at: true,
} as const;

export async function getFeedbackLeads(filter?: ListFeedbackLeadsQuery) {
  return prisma.feedback_leads.findMany({
    where: {
      deleted_at: null,
      ...(filter?.email !== undefined ? { email: filter.email } : {}),
    },
    select: feedbackLeadSelect,
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
  });
}

export async function getFeedbackLeadById(id: number) {
  const lead = await prisma.feedback_leads.findUnique({
    where: { id },
    select: feedbackLeadSelect,
  });

  if (!lead) {
    throw new FeedbackLeadNotFoundError(id);
  }

  return lead;
}

export async function updateFeedbackLead(
  id: number,
  data: UpdateFeedbackLeadInput
) {
  await getFeedbackLeadById(id);

  return prisma.feedback_leads.update({
    where: { id },
    data: {
      ...data,
      hospital_location: data.hospital_location ?? null,
      updated_at: new Date(),
    },
    select: feedbackLeadSelect,
  });
}

/**
 * Soft delete: this table has no status column, so a nullable `deleted_at`
 * timestamp was added specifically for this (see prisma/schema.prisma) —
 * the row is never physically removed, and getFeedbackLeads() above
 * excludes anything with deleted_at set.
 */
export async function deleteFeedbackLead(id: number) {
  await getFeedbackLeadById(id);

  await prisma.feedback_leads.update({
    where: { id },
    data: { deleted_at: new Date(), updated_at: new Date() },
  });
}
