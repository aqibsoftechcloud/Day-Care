"use client";

import { useMemo } from "react";
import { Eye, ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { Symptom } from "@/types/symptom";
import type { SymptomPart } from "@/types/symptom-part";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { FilterDropdown } from "@/components/admin/data-table/FilterDropdown";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";

type SymptomsTableProps = {
  symptoms: Symptom[];
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
  onView: (symptom: Symptom) => void;
  onEdit: (symptom: Symptom) => void;
  onDelete: (symptom: Symptom) => void;
};

export function SymptomsTable({
  symptoms,
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
}: SymptomsTableProps) {
  const columns = useMemo<LegacyColumnDef<Symptom>[]>(
    () => [
      {
        id: "symptom_name",
        accessorKey: "symptom_name",
        header: "Symptom",
        cell: ({ row }) => (
          <span className="max-w-xs truncate text-table-body font-semibold text-foreground">
            {row.original.symptom_name}
          </span>
        ),
      },
      {
        id: "part",
        header: "Part",
        enableSorting: false,
        cell: ({ row }) => <span className="text-body-sm text-foreground">{row.original.part.part_name}</span>,
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
          const symptom = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canView && (
                <TableActionButton icon={Eye} label="View" ariaLabel="View symptom" onClick={() => onView(symptom)} />
              )}
              {canUpdate && (
                <TableActionButton icon={Pencil} label="Edit" ariaLabel="Edit symptom" onClick={() => onEdit(symptom)} />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete symptom"
                  variant="destructive"
                  onClick={() => onDelete(symptom)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [canView, canUpdate, canDelete, onView, onEdit, onDelete]
  );

  const filteredSymptoms = useMemo(() => {
    const q = search.trim().toLowerCase();
    return symptoms.filter((symptom) => {
      const matchesSearch = !q || symptom.symptom_name.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || symptom.status === statusFilter;
      const matchesPart = partFilter === "all" || String(symptom.part_id) === partFilter;
      return matchesSearch && matchesStatus && matchesPart;
    });
  }, [symptoms, search, statusFilter, partFilter]);

  const isFiltering = search.trim() !== "" || statusFilter !== "all" || partFilter !== "all";

  return (
    <DataTable
      columns={columns}
      data={filteredSymptoms}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(symptom) => String(symptom.id)}
      emptyIcon={ListChecks}
      emptyTitle={isFiltering ? "No matching symptoms" : "No symptoms found"}
      emptyDescription={
        isFiltering ? "Try adjusting your search or filters." : "Create your first symptom to get started."
      }
      emptyAction={
        !isFiltering && canCreate ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add Symptom
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
          search={<SearchInput value={search} onChange={onSearchChange} placeholder="Search symptoms…" />}
        />
      }
    />
  );
}
