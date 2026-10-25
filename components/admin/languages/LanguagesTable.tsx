"use client";

import { useMemo } from "react";
import { Eye, Globe, Pencil, Plus, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { Language } from "@/types/language";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { FilterDropdown } from "@/components/admin/data-table/FilterDropdown";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";

type LanguagesTableProps = {
  languages: Language[];
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
  onView: (language: Language) => void;
  onEdit: (language: Language) => void;
  onDelete: (language: Language) => void;
};

export function LanguagesTable({
  languages,
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
}: LanguagesTableProps) {
  const columns = useMemo<LegacyColumnDef<Language>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Language",
        cell: ({ row }) => (
          <div className="flex max-w-xs flex-col gap-0.5 py-0.5">
            <span className="truncate text-table-body font-semibold text-foreground">
              {row.original.name}
            </span>
            <span className="truncate text-caption">{row.original.seo_url}</span>
          </div>
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
        id: "updated_at",
        accessorKey: "updated_at",
        header: "Updated",
        cell: ({ row }) => (
          <span className="text-body-sm text-muted-foreground">{formatDate(row.original.updated_at)}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const language = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canView && (
                <TableActionButton icon={Eye} label="View" ariaLabel="View language" onClick={() => onView(language)} />
              )}
              {canUpdate && (
                <TableActionButton icon={Pencil} label="Edit" ariaLabel="Edit language" onClick={() => onEdit(language)} />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete language"
                  variant="destructive"
                  onClick={() => onDelete(language)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [canView, canUpdate, canDelete, onView, onEdit, onDelete]
  );

  const filteredLanguages = useMemo(() => {
    const q = search.trim().toLowerCase();
    return languages.filter((language) => {
      const matchesSearch =
        !q || language.name.toLowerCase().includes(q) || language.seo_url.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || language.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [languages, search, statusFilter]);

  const isFiltering = search.trim() !== "" || statusFilter !== "all";

  return (
    <DataTable
      columns={columns}
      data={filteredLanguages}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(language) => String(language.id)}
      emptyIcon={Globe}
      emptyTitle={isFiltering ? "No matching languages" : "No languages found"}
      emptyDescription={
        isFiltering
          ? "Try adjusting your search or status filter."
          : "Create your first language to start associating content with it."
      }
      emptyAction={
        !isFiltering && canCreate ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add Language
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
          search={<SearchInput value={search} onChange={onSearchChange} placeholder="Search languages…" />}
        />
      }
    />
  );
}
