"use client";

import { useMemo } from "react";
import { Eye, HelpCircle, Pencil, Plus, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { GeneralFaq } from "@/types/general-faq";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { FilterDropdown } from "@/components/admin/data-table/FilterDropdown";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";

type GeneralFaqsTableProps = {
  faqs: GeneralFaq[];
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
  onView: (faq: GeneralFaq) => void;
  onEdit: (faq: GeneralFaq) => void;
  onDelete: (faq: GeneralFaq) => void;
};

export function GeneralFaqsTable({
  faqs,
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
}: GeneralFaqsTableProps) {
  const columns = useMemo<LegacyColumnDef<GeneralFaq>[]>(
    () => [
      {
        id: "question",
        accessorKey: "question",
        header: "Question",
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-sm text-table-body font-semibold text-foreground">
            {row.original.question}
          </span>
        ),
      },
      {
        id: "answer",
        accessorKey: "answer",
        header: "Answer",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-md text-body-sm text-muted-foreground">
            {row.original.answer}
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
          const faq = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canView && (
                <TableActionButton icon={Eye} label="View" ariaLabel="View FAQ" onClick={() => onView(faq)} />
              )}
              {canUpdate && (
                <TableActionButton icon={Pencil} label="Edit" ariaLabel="Edit FAQ" onClick={() => onEdit(faq)} />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete FAQ"
                  variant="destructive"
                  onClick={() => onDelete(faq)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [canView, canUpdate, canDelete, onView, onEdit, onDelete]
  );

  const filteredFaqs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return faqs.filter((faq) => {
      const matchesSearch =
        !q || faq.question.toLowerCase().includes(q) || faq.answer.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || faq.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [faqs, search, statusFilter]);

  const isFiltering = search.trim() !== "" || statusFilter !== "all";

  return (
    <DataTable
      columns={columns}
      data={filteredFaqs}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(faq) => String(faq.id)}
      emptyIcon={HelpCircle}
      emptyTitle={isFiltering ? "No matching FAQs" : "No FAQs found"}
      emptyDescription={
        isFiltering
          ? "Try adjusting your search or status filter."
          : "Create your first FAQ to help visitors find answers."
      }
      emptyAction={
        !isFiltering && canCreate ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add FAQ
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
          search={<SearchInput value={search} onChange={onSearchChange} placeholder="Search FAQs…" />}
        />
      }
    />
  );
}
