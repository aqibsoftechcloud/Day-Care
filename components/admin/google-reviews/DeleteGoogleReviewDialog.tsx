"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteGoogleReview } from "@/lib/api/google-reviews";
import { notify } from "@/lib/toast";
import { googleReviewsKeys } from "@/components/admin/google-reviews/queries";
import type { GoogleReview } from "@/types/google-review";

type DeleteGoogleReviewDialogProps = {
  review: GoogleReview | null;
  onClose: () => void;
};

export function DeleteGoogleReviewDialog({ review, onClose }: DeleteGoogleReviewDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteGoogleReview(id),
    onSuccess: () => {
      notify.success("Review deleted successfully.");
      queryClient.invalidateQueries({ queryKey: googleReviewsKeys.all });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete the review.");
    },
  });

  if (!review) return null;

  return (
    <DeleteConfirmDialog
      open={!!review}
      title="Delete review?"
      description={`Are you sure you want to delete the review for "${review.google_location}"? This deactivates it — the record is kept.`}
      confirmLabel="Delete Review"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(review.id)}
      onCancel={onClose}
    />
  );
}
