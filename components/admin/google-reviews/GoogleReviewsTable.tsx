"use client";

import { useMemo } from "react";
import { Eye, MessageSquareQuote, Pencil, Plus, Star, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { GoogleReview } from "@/types/google-review";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { FilterDropdown } from "@/components/admin/data-table/FilterDropdown";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";

type GoogleReviewsTableProps = {
  reviews: GoogleReview[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  canView: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canCreate: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onCreate: () => void;
  onView: (review: GoogleReview) => void;
  onEdit: (review: GoogleReview) => void;
  onDelete: (review: GoogleReview) => void;
};

export function GoogleReviewsTable({
  reviews,
  loading,
  error,
  onRetry,
  canView,
  canUpdate,
  canDelete,
  canCreate,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onCreate,
  onView,
  onEdit,
  onDelete,
}: GoogleReviewsTableProps) {
  const columns = useMemo<LegacyColumnDef<GoogleReview>[]>(
    () => [
      {
        id: "google_location",
        accessorKey: "google_location",
        header: "Location",
        cell: ({ row }) => (
          <span className="truncate text-table-body font-semibold text-foreground">
            {row.original.google_location}
          </span>
        ),
      },
      {
        id: "google_rating",
        accessorKey: "google_rating",
        header: "Rating",
        cell: ({ row }) =>
          row.original.google_rating ? (
            <span className="inline-flex items-center gap-1 text-body-sm text-foreground">
              <Star className="size-3.5 fill-warning text-warning" aria-hidden="true" />
              {row.original.google_rating}
            </span>
          ) : (
            <span className="text-body-sm text-muted-foreground">—</span>
          ),
      },
      {
        id: "google_review",
        accessorKey: "google_review",
        header: "Review",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-md text-body-sm text-muted-foreground">
            {row.original.google_review}
          </span>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "created_at",
        accessorKey: "created_at",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-body-sm text-muted-foreground">{formatDate(row.original.created_at)}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const review = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canView && (
                <TableActionButton icon={Eye} label="View" ariaLabel="View review" onClick={() => onView(review)} />
              )}
              {canUpdate && (
                <TableActionButton icon={Pencil} label="Edit" ariaLabel="Edit review" onClick={() => onEdit(review)} />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete review"
                  variant="destructive"
                  onClick={() => onDelete(review)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [canView, canUpdate, canDelete, onView, onEdit, onDelete]
  );

  const filteredReviews = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reviews.filter((review) => {
      const matchesSearch =
        !q ||
        review.google_location.toLowerCase().includes(q) ||
        review.google_review.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || review.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [reviews, search, statusFilter]);

  const isFiltering = search.trim() !== "" || statusFilter !== "all";

  return (
    <DataTable
      columns={columns}
      data={filteredReviews}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(review) => String(review.id)}
      emptyIcon={MessageSquareQuote}
      emptyTitle={isFiltering ? "No matching reviews" : "No Google reviews found"}
      emptyDescription={
        isFiltering
          ? "Try adjusting your search or status filter."
          : "Add your first Google review to showcase it on the website."
      }
      emptyAction={
        !isFiltering && canCreate ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add Review
          </Button>
        ) : undefined
      }
      toolbar={
        <FilterBar
          filters={
            <FilterDropdown
              label="Status"
              value={statusFilter}
              onChange={onStatusFilterChange}
              options={[
                { label: "All statuses", value: "all" },
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ]}
            />
          }
          search={<SearchInput value={search} onChange={onSearchChange} placeholder="Search reviews…" />}
        />
      }
    />
  );
}
