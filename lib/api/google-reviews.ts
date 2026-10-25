import { apiFetch } from "./client";
import type { CreateGoogleReviewInput, GoogleReview, UpdateGoogleReviewInput } from "@/types/google-review";

type GoogleReviewsListResponse = { success: true; googleReviews: GoogleReview[] };
type GoogleReviewResponse = { success: true; googleReview: GoogleReview };
type DeleteGoogleReviewResponse = { success: true; message: string };

/** Mirrors validators/google-review.validator.ts's listGoogleReviewsQuerySchema — `google_location` and `status` only, both exact match. */
export function listGoogleReviews(filter?: { google_location?: string; status?: string }) {
  return apiFetch<GoogleReviewsListResponse>("/api/google-reviews", {
    query: { google_location: filter?.google_location, status: filter?.status },
  });
}

export function getGoogleReview(id: number) {
  return apiFetch<GoogleReviewResponse>(`/api/google-reviews/${id}`);
}

export function createGoogleReview(data: CreateGoogleReviewInput) {
  return apiFetch<GoogleReviewResponse>("/api/google-reviews", { method: "POST", body: data });
}

export function updateGoogleReview(id: number, data: UpdateGoogleReviewInput) {
  return apiFetch<GoogleReviewResponse>(`/api/google-reviews/${id}`, { method: "PUT", body: data });
}

/** Soft delete — sets status to "inactive" server-side. */
export function deleteGoogleReview(id: number) {
  return apiFetch<DeleteGoogleReviewResponse>(`/api/google-reviews/${id}`, { method: "DELETE" });
}
