import { prisma } from "@/lib/prisma";
import type {
  CreateGoogleReviewInput,
  ListGoogleReviewsQuery,
  UpdateGoogleReviewInput,
} from "@/validators/google-review.validator";

export class GoogleReviewNotFoundError extends Error {
  constructor(id: number) {
    super(`Google review with id ${id} not found`);
    this.name = "GoogleReviewNotFoundError";
  }
}

const googleReviewSelect = {
  id: true,
  google_location: true,
  google_rating: true,
  google_review: true,
  status: true,
  created_at: true,
  updated_at: true,
} as const;

export async function getGoogleReviews(filter?: ListGoogleReviewsQuery) {
  return prisma.google_reviews.findMany({
    where: {
      ...(filter?.google_location !== undefined
        ? { google_location: filter.google_location }
        : {}),
      ...(filter?.status !== undefined ? { status: filter.status } : {}),
    },
    select: googleReviewSelect,
    orderBy: { id: "asc" },
  });
}

export async function getGoogleReviewById(id: number) {
  const googleReview = await prisma.google_reviews.findUnique({
    where: { id },
    select: googleReviewSelect,
  });

  if (!googleReview) {
    throw new GoogleReviewNotFoundError(id);
  }

  return googleReview;
}

export async function createGoogleReview(data: CreateGoogleReviewInput) {
  return prisma.google_reviews.create({
    data,
    select: googleReviewSelect,
  });
}

export async function updateGoogleReview(
  id: number,
  data: UpdateGoogleReviewInput
) {
  const current = await prisma.google_reviews.findUnique({ where: { id } });

  if (!current) {
    throw new GoogleReviewNotFoundError(id);
  }

  return prisma.google_reviews.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
    select: googleReviewSelect,
  });
}

/**
 * Soft delete: deactivates the Google review by setting status to
 * "inactive". Never physically deleted.
 */
export async function deleteGoogleReview(id: number) {
  const current = await prisma.google_reviews.findUnique({ where: { id } });

  if (!current) {
    throw new GoogleReviewNotFoundError(id);
  }

  await prisma.google_reviews.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
