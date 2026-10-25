"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type DataTablePaginationProps = {
  pageIndex: number;
  pageCount: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  totalRows: number;
  pageSize: number;
};

export function DataTablePagination({
  pageIndex,
  pageCount,
  canPreviousPage,
  canNextPage,
  onPreviousPage,
  onNextPage,
  totalRows,
  pageSize,
}: DataTablePaginationProps) {
  const start = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const end = totalRows === 0 ? 0 : Math.min(totalRows, (pageIndex + 1) * pageSize);
  const showControls = totalRows > 0 && pageCount > 1;

  return (
    <div className="flex flex-col gap-2 border-t border-border bg-muted/20 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-body-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{start}–{end}</span> of{" "}
        <span className="font-medium text-foreground">{totalRows}</span>{" "}
        {totalRows === 1 ? "item" : "items"}
      </p>
      {showControls && (
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span className="text-body-sm text-muted-foreground">
            Page {pageIndex + 1} of {Math.max(pageCount, 1)}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={onPreviousPage}
              disabled={!canPreviousPage}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={onNextPage}
              disabled={!canNextPage}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
