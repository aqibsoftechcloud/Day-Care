"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useLegacyTable,
  type LegacyColumnDef,
} from "@tanstack/react-table/legacy";
import { flexRender, type RowData, type SortingState } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminCard } from "@/components/admin/AdminCard";
import { TableSkeleton } from "@/components/admin/data-table/TableSkeleton";
import { DataTablePagination } from "@/components/admin/data-table/DataTablePagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { cn } from "@/lib/utils";

/** Per-column filter slot — set on a column's `meta` to render a compact filter control directly under that column's header. Only columns backed by an actual API filter param should set this. */
type ColumnFilterMeta = { filterSlot?: ReactNode };

const ROW_NUMBER_COLUMN_ID = "__row_number";

type DataTableProps<TData extends RowData> = {
  columns: LegacyColumnDef<TData>[];
  data: TData[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  getRowId?: (row: TData) => string;
  toolbar?: ReactNode;
  pageSize?: number;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  /** "compact" tightens header/row padding for information-dense listings (e.g. leads) without affecting the default look used elsewhere. */
  density?: "default" | "compact";
  /** Prepends a narrow "#" column showing each row's position in the current (filtered, paginated) result set. */
  showRowNumbers?: boolean;
};

/**
 * Single reusable admin list-table pattern built on TanStack Table's v9
 * migration-compatible `useLegacyTable` (client-side sort/paginate —
 * callers pass already filtered `data`, this owns column sorting and
 * pagination). Meant to be reused as-is for every future CMS module list.
 */
export function DataTable<TData extends RowData>({
  columns,
  data,
  loading = false,
  error = null,
  onRetry,
  getRowId,
  toolbar,
  pageSize = 10,
  emptyIcon,
  emptyTitle = "No records found",
  emptyDescription,
  emptyAction,
  density = "default",
  showRowNumbers = false,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const tableColumns = useMemo<LegacyColumnDef<TData>[]>(() => {
    if (!showRowNumbers) return columns;
    const rowNumberColumn: LegacyColumnDef<TData> = {
      id: ROW_NUMBER_COLUMN_ID,
      header: "#",
      enableSorting: false,
      cell: ({ row }) => <span className="text-caption">{row.index + 1}</span>,
    };
    return [rowNumberColumn, ...columns];
  }, [columns, showRowNumbers]);

  const table = useLegacyTable({
    data,
    columns: tableColumns,
    getRowId: getRowId as ((row: TData) => string) | undefined,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize } },
  });

  const rows = table.getRowModel().rows;
  const hasFilterRow = tableColumns.some(
    (col) => (col.meta as ColumnFilterMeta | undefined)?.filterSlot
  );

  const isCompact = density === "compact";
  const headerCellClass = isCompact ? "h-8 px-3" : "h-10 px-5";
  const bodyCellClass = isCompact ? "px-3 py-2" : "px-5 py-3.5";

  return (
    <AdminCard>
      {toolbar && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          {toolbar}
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={6} columns={tableColumns.length} />
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : (
        <>
          {rows.length === 0 ? (
            <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} action={emptyAction} />
          ) : (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="border-border/80 hover:bg-transparent">
                    {headerGroup.headers.map((header) => {
                      const canSort = header.column.getCanSort();
                      const sorted = header.column.getIsSorted();
                      const isRowNumber = header.column.id === ROW_NUMBER_COLUMN_ID;
                      return (
                        <TableHead
                          key={header.id}
                          className={cn(
                            // Literal utilities, not the .text-table-header class — TableHead's own
                            // base classes (font-medium text-foreground) are Tailwind utilities too,
                            // and Tailwind's utilities layer always wins over our components-layer
                            // classes regardless of source order, so a custom class can't override
                            // them here. Arbitrary-value utilities merge correctly via `cn`, so use those.
                            headerCellClass,
                            "bg-muted/50 text-[11px] font-semibold tracking-wide text-muted-foreground/85 uppercase",
                            canSort && "cursor-pointer select-none hover:text-foreground",
                            isRowNumber && "w-10"
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {header.isPlaceholder ? null : (
                            <span className="inline-flex items-center gap-1">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {canSort &&
                                (sorted === "asc" ? (
                                  <ArrowUp className="size-3.5" aria-hidden="true" />
                                ) : sorted === "desc" ? (
                                  <ArrowDown className="size-3.5" aria-hidden="true" />
                                ) : (
                                  <ArrowUpDown className="size-3.5 text-muted-foreground/40" aria-hidden="true" />
                                ))}
                            </span>
                          )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
                {hasFilterRow &&
                  table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={`${headerGroup.id}-filters`} className="border-border/80 hover:bg-transparent">
                      {headerGroup.headers.map((header) => {
                        const meta = header.column.columnDef.meta as ColumnFilterMeta | undefined;
                        return (
                          <TableHead
                            key={`${header.id}-filter`}
                            className={cn(headerCellClass, "h-auto bg-muted/25 py-1.5")}
                          >
                            {meta?.filterSlot ?? null}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "border-border/70 last:border-b-0",
                      // Zebra striping via a plain (non-variant) class rather than
                      // `even:` — that would tie in CSS specificity with the base
                      // primitive's `hover:`/`data-[state=selected]:` rules and
                      // depend on Tailwind's internal variant-sort order to break
                      // the tie. A plain class has lower specificity than either,
                      // so hover/selected always win regardless of source order.
                      index % 2 === 1 && "bg-muted/30"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(bodyCellClass, cell.column.id === ROW_NUMBER_COLUMN_ID && "text-center")}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <DataTablePagination
            pageIndex={table.getState().pagination.pageIndex}
            pageCount={table.getPageCount()}
            canPreviousPage={table.getCanPreviousPage()}
            canNextPage={table.getCanNextPage()}
            onPreviousPage={() => table.previousPage()}
            onNextPage={() => table.nextPage()}
            totalRows={data.length}
            pageSize={pageSize}
          />
        </>
      )}
    </AdminCard>
  );
}
