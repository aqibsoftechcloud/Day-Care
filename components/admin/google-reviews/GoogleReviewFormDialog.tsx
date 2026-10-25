"use client";

import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/admin/FormDialog";
import { LoadingButton } from "@/components/admin/LoadingButton";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { ApiError } from "@/lib/api/client";
import { createGoogleReview, getGoogleReview, updateGoogleReview } from "@/lib/api/google-reviews";
import { notify } from "@/lib/toast";
import { googleReviewsKeys } from "@/components/admin/google-reviews/queries";
import type { GoogleReview } from "@/types/google-review";

// Mirrors validators/google-review.validator.ts's createGoogleReviewSchema.
// google_rating maps to a DECIMAL(2,1) column (max 9.9) — kept as a string
// here and only parsed to a number if non-blank, matching the backend's
// `decimalInputSchema` (accepts either a number or a numeric string).
const googleReviewFormSchema = z.object({
  google_location: z.string().trim().min(1, "Location is required").max(255, "Location is too long"),
  google_rating: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d+(\.\d+)?$/.test(value), "Enter a valid rating")
    .optional(),
  google_review: z.string().trim().min(1, "Review text is required"),
  status: z.enum(["active", "inactive"]),
});

type GoogleReviewFormValues = z.infer<typeof googleReviewFormSchema>;

type GoogleReviewFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  reviewId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function GoogleReviewFormDialog({ open, mode, reviewId, onOpenChange }: GoogleReviewFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add Google Review" : "Edit Google Review"}
      description={mode === "create" ? "Add a new Google review." : "Update this review's details."}
    >
      {/* Keyed by review so re-opening for a different review remounts
          with fresh defaultValues instead of needing a reset-in-effect. */}
      {open && (
        <GoogleReviewFormBody
          key={mode === "edit" ? (reviewId ?? "edit") : "create"}
          mode={mode}
          reviewId={reviewId}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function GoogleReviewFormBody({
  mode,
  reviewId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  reviewId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const reviewQuery = useQuery({
    queryKey: googleReviewsKeys.detail(reviewId ?? -1),
    queryFn: () => getGoogleReview(reviewId as number),
    enabled: mode === "edit" && reviewId !== null,
  });

  if (mode === "edit" && reviewQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading review…
      </div>
    );
  }

  if (mode === "edit" && reviewQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {reviewQuery.error instanceof ApiError ? reviewQuery.error.message : "Failed to load review."}
      </p>
    );
  }

  return (
    <GoogleReviewForm
      mode={mode}
      reviewId={reviewId}
      initialReview={reviewQuery.data?.googleReview}
      onOpenChange={onOpenChange}
    />
  );
}

function GoogleReviewForm({
  mode,
  reviewId,
  initialReview,
  onOpenChange,
}: {
  mode: "create" | "edit";
  reviewId: number | null;
  initialReview?: GoogleReview;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<GoogleReviewFormValues>({
    resolver: zodResolver(googleReviewFormSchema),
    defaultValues: {
      google_location: initialReview?.google_location ?? "",
      google_rating: initialReview?.google_rating ?? "",
      google_review: initialReview?.google_review ?? "",
      status: initialReview?.status === "inactive" ? "inactive" : "active",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: GoogleReviewFormValues) => {
      const payload = {
        google_location: values.google_location,
        google_rating: values.google_rating ? Number(values.google_rating) : null,
        google_review: values.google_review,
        status: values.status,
      };
      if (mode === "create") {
        return createGoogleReview(payload);
      }
      return updateGoogleReview(reviewId as number, payload);
    },
    onSuccess: () => {
      notify.success(mode === "create" ? "Review created successfully." : "Review updated successfully.");
      queryClient.invalidateQueries({ queryKey: googleReviewsKeys.all });
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: GoogleReviewFormValues) => {
    mutation.mutate(values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {mutation.isError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {mutation.error instanceof ApiError ? mutation.error.message : "Something went wrong."}
        </div>
      )}

      <FieldGroup className="gap-4">
        <Field data-invalid={!!errors.google_location || undefined}>
          <FieldLabel htmlFor="review-location">
            Location <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="review-location"
            placeholder="e.g. Andheri Branch"
            aria-invalid={!!errors.google_location || undefined}
            {...register("google_location")}
          />
          <FieldError errors={[errors.google_location]} />
        </Field>

        <Field data-invalid={!!errors.google_rating || undefined}>
          <FieldLabel htmlFor="review-rating">
            Rating <span className="text-muted-foreground">(optional, out of 9.9)</span>
          </FieldLabel>
          <Input
            id="review-rating"
            type="number"
            step="0.1"
            min="0"
            max="9.9"
            placeholder="e.g. 4.5"
            aria-invalid={!!errors.google_rating || undefined}
            {...register("google_rating")}
          />
          <FieldError errors={[errors.google_rating]} />
        </Field>

        <Field data-invalid={!!errors.google_review || undefined}>
          <FieldLabel htmlFor="review-text">
            Review <span className="text-destructive">*</span>
          </FieldLabel>
          <Textarea
            id="review-text"
            rows={5}
            placeholder="Paste the review text"
            aria-invalid={!!errors.google_review || undefined}
            {...register("google_review")}
          />
          <FieldError errors={[errors.google_review]} />
        </Field>

        <Field data-invalid={!!errors.status || undefined}>
          <FieldLabel htmlFor="review-status">Status</FieldLabel>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="review-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.status]} />
        </Field>
      </FieldGroup>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting || mutation.isPending}
        >
          Cancel
        </Button>
        <LoadingButton type="submit" disabled={isSubmitting} loading={mutation.isPending}>
          {mode === "create" ? "Create Review" : "Save Changes"}
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
