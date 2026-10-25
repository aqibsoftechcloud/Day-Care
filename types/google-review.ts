export type GoogleReviewStatus = "active" | "inactive";

/** Mirrors services/google-review.service.ts's plain row output. `google_rating` is a Prisma `Decimal` (DB DECIMAL(2,1)) — serialized as a string by NextResponse.json. */
export type GoogleReview = {
  id: number;
  google_location: string;
  google_rating: string | null;
  google_review: string;
  status: GoogleReviewStatus;
  created_at: string;
  updated_at: string;
};

/** Mirrors validators/google-review.validator.ts's createGoogleReviewSchema. */
export type CreateGoogleReviewInput = {
  google_location: string;
  google_rating?: number | string | null;
  google_review: string;
  status?: GoogleReviewStatus;
};

export type UpdateGoogleReviewInput = Partial<CreateGoogleReviewInput>;
