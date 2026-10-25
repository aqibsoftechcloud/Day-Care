"use client";

import { useMemo } from "react";
import { Eye, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { SymptomArticle } from "@/types/symptom-article";
import type { SymptomPart } from "@/types/symptom-part";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { FilterDropdown } from "@/components/admin/data-table/FilterDropdown";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";

type SymptomArticlesTableProps = {
  symptomArticles: SymptomArticle[];
  symptomParts: SymptomPart[];
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
  partFilter: string;
  onPartFilterChange: (value: string) => void;
  onCreate: () => void;
  onView: (article: SymptomArticle) => void;
  onEdit: (article: SymptomArticle) => void;
  onDelete: (article: SymptomArticle) => void;
};

export function SymptomArticlesTable({
  symptomArticles,
  symptomParts,
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
  partFilter,
  onPartFilterChange,
  onCreate,
  onView,
  onEdit,
  onDelete,
}: SymptomArticlesTableProps) {
  const columns = useMemo<LegacyColumnDef<SymptomArticle>[]>(
    () => [
      {
        id: "article_name",
        accessorKey: "article_name",
        header: "Article",
        cell: ({ row }) => (
          <div className="flex max-w-xs flex-col gap-0.5 py-0.5">
            <span className="truncate text-table-body font-semibold text-foreground">
              {row.original.article_name}
            </span>
            <span className="truncate text-caption">{row.original.seo_url}</span>
          </div>
        ),
      },
      {
        id: "part",
        header: "Part",
        enableSorting: false,
        cell: ({ row }) => <span className="text-body-sm text-foreground">{row.original.part.part_name}</span>,
      },
      {
        id: "symptom",
        header: "Symptom",
        enableSorting: false,
        cell: ({ row }) => <span className="text-body-sm text-foreground">{row.original.symptom.symptom_name}</span>,
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
          const article = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canView && (
                <TableActionButton icon={Eye} label="View" ariaLabel="View article" onClick={() => onView(article)} />
              )}
              {canUpdate && (
                <TableActionButton icon={Pencil} label="Edit" ariaLabel="Edit article" onClick={() => onEdit(article)} />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete article"
                  variant="destructive"
                  onClick={() => onDelete(article)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [canView, canUpdate, canDelete, onView, onEdit, onDelete]
  );

  const filteredArticles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return symptomArticles.filter((article) => {
      const matchesSearch =
        !q || article.article_name.toLowerCase().includes(q) || article.seo_url.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || article.status === statusFilter;
      const matchesPart = partFilter === "all" || String(article.part_id) === partFilter;
      return matchesSearch && matchesStatus && matchesPart;
    });
  }, [symptomArticles, search, statusFilter, partFilter]);

  const isFiltering = search.trim() !== "" || statusFilter !== "all" || partFilter !== "all";

  return (
    <DataTable
      columns={columns}
      data={filteredArticles}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(article) => String(article.id)}
      emptyIcon={FileText}
      emptyTitle={isFiltering ? "No matching articles" : "No articles found"}
      emptyDescription={
        isFiltering ? "Try adjusting your search or filters." : "Create your first article to get started."
      }
      emptyAction={
        !isFiltering && canCreate ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add Article
          </Button>
        ) : undefined
      }
      toolbar={
        <FilterBar
          filters={
            <>
              <FilterDropdown
                label="Part"
                value={partFilter}
                onChange={onPartFilterChange}
                options={[
                  { label: "All parts", value: "all" },
                  ...symptomParts.map((part) => ({ label: part.part_name, value: String(part.id) })),
                ]}
              />
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
            </>
          }
          search={<SearchInput value={search} onChange={onSearchChange} placeholder="Search articles…" />}
        />
      }
    />
  );
}
