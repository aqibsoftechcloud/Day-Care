"use client";

import { useMemo } from "react";
import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { InsuranceCompany } from "@/types/insurance-company";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { FilterDropdown } from "@/components/admin/data-table/FilterDropdown";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";

type InsuranceCompaniesTableProps = {
  insuranceCompanies: InsuranceCompany[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  canUpdate: boolean;
  canDelete: boolean;
  canCreate: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onCreate: () => void;
  onEdit: (item: InsuranceCompany) => void;
  onDelete: (item: InsuranceCompany) => void;
};

export function InsuranceCompaniesTable({
  insuranceCompanies,
  loading,
  error,
  onRetry,
  canUpdate,
  canDelete,
  canCreate,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onCreate,
  onEdit,
  onDelete,
}: InsuranceCompaniesTableProps) {
  const columns = useMemo<LegacyColumnDef<InsuranceCompany>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Insurance Company",
        cell: ({ row }) => (
          <div className="flex items-center gap-3 py-0.5">
            {row.original.logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin table thumbnail, not the public site.
              <img src={row.original.logo} alt="" className="size-8 shrink-0 rounded-md border border-border object-contain" />
            ) : (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                <ShieldCheck className="size-4" aria-hidden="true" />
              </span>
            )}
            <div className="flex max-w-xs flex-col gap-0.5">
              <span className="truncate text-table-body font-semibold text-foreground">{row.original.name}</span>
              <span className="truncate text-caption">{row.original.seo_url}</span>
            </div>
          </div>
        ),
      },
      {
        id: "status",
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
          const item = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canUpdate && (
                <TableActionButton icon={Pencil} label="Edit" ariaLabel="Edit insurance company" onClick={() => onEdit(item)} />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete insurance company"
                  variant="destructive"
                  onClick={() => onDelete(item)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [canUpdate, canDelete, onEdit, onDelete]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return insuranceCompanies.filter((item) => {
      const matchesSearch = !q || item.name.toLowerCase().includes(q) || item.seo_url.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [insuranceCompanies, search, statusFilter]);

  const isFiltering = search.trim() !== "" || statusFilter !== "all";

  return (
    <DataTable
      columns={columns}
      data={filtered}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(item) => String(item.id)}
      emptyIcon={ShieldCheck}
      emptyTitle={isFiltering ? "No matching insurance companies" : "No insurance companies found"}
      emptyDescription={
        isFiltering ? "Try adjusting your search or filters." : "Create your first insurance company to get started."
      }
      emptyAction={
        !isFiltering && canCreate ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add Insurance Company
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
          search={<SearchInput value={search} onChange={onSearchChange} placeholder="Search insurance companies…" />}
        />
      }
    />
  );
}
