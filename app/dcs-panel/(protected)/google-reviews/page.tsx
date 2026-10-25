"use client";

import { useState } from "react";
import { Plus, ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { GoogleReviewsTable } from "@/components/admin/google-reviews/GoogleReviewsTable";
import { GoogleReviewFormDialog } from "@/components/admin/google-reviews/GoogleReviewFormDialog";
import { GoogleReviewViewDialog } from "@/components/admin/google-reviews/GoogleReviewViewDialog";
import { DeleteGoogleReviewDialog } from "@/components/admin/google-reviews/DeleteGoogleReviewDialog";
import { googleReviewsKeys } from "@/components/admin/google-reviews/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listGoogleReviews } from "@/lib/api/google-reviews";
import type { GoogleReview } from "@/types/google-review";

export default function GoogleReviewsPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("google-reviews");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formModal, setFormModal] = useState<
    { mode: "create" } | { mode: "edit"; reviewId: number } | null
  >(null);
  const [viewTarget, setViewTarget] = useState<GoogleReview | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GoogleReview | null>(null);

  const reviewsQuery = useQuery({
    queryKey: googleReviewsKeys.all,
    queryFn: () => listGoogleReviews(),
    enabled: hasViewAccess,
  });

  if (!hasViewAccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card px-6 py-20 text-center shadow-xs">
        <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShieldOff className="size-5" aria-hidden="true" />
        </span>
        <p className="text-subtitle text-foreground">Access restricted</p>
        <p className="mt-1 max-w-sm text-body-sm text-muted-foreground">
          You don&apos;t have permission to view Google Reviews.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Google Reviews"
        description="Manage Google reviews displayed on the website."
        action={
          canCreate("google-reviews") ? (
            <Button onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add Review
            </Button>
          ) : undefined
        }
      />

      <GoogleReviewsTable
        reviews={reviewsQuery.data?.googleReviews ?? []}
        loading={reviewsQuery.isLoading}
        error={
          reviewsQuery.isError
            ? reviewsQuery.error instanceof ApiError
              ? reviewsQuery.error.message
              : "Unable to load reviews. Please try again."
            : null
        }
        onRetry={() => reviewsQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={canUpdate("google-reviews")}
        canDelete={canDelete("google-reviews")}
        canCreate={canCreate("google-reviews")}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onCreate={() => setFormModal({ mode: "create" })}
        onView={(review) => setViewTarget(review)}
        onEdit={(review) => setFormModal({ mode: "edit", reviewId: review.id })}
        onDelete={(review) => setDeleteTarget(review)}
      />

      <GoogleReviewFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        reviewId={formModal?.mode === "edit" ? formModal.reviewId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <GoogleReviewViewDialog review={viewTarget} onClose={() => setViewTarget(null)} />

      <DeleteGoogleReviewDialog review={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
