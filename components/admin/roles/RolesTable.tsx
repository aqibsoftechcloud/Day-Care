"use client";

import { useMemo } from "react";
import { Eye, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { Role } from "@/types/role";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { FilterDropdown } from "@/components/admin/data-table/FilterDropdown";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";

type RolesTableProps = {
  roles: Role[];
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
  onEdit: (role: Role) => void;
  onManagePermissions: (role: Role) => void;
  onDelete: (role: Role) => void;
};

export function RolesTable({
  roles,
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
  onEdit,
  onManagePermissions,
  onDelete,
}: RolesTableProps) {
  const columns = useMemo<LegacyColumnDef<Role>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Role",
        cell: ({ row }) => (
          <div className="flex max-w-xs flex-col gap-0.5 py-0.5">
            <span className="truncate text-table-body font-semibold text-foreground">
              {row.original.name}
            </span>
            <span className="truncate text-caption">{row.original.description || "No description"}</span>
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
          <span className="text-body-sm text-muted-foreground">
            {formatDate(row.original.created_at)}
          </span>
        ),
      },
      {
        id: "updated_at",
        accessorKey: "updated_at",
        header: "Updated",
        cell: ({ row }) => (
          <span className="text-body-sm text-muted-foreground">
            {formatDate(row.original.updated_at)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const role = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canView && (
                <TableActionButton
                  icon={Eye}
                  label="View"
                  ariaLabel="View role"
                  onClick={() => onManagePermissions(role)}
                />
              )}
              {canUpdate && (
                <TableActionButton
                  icon={Pencil}
                  label="Edit"
                  ariaLabel="Edit role"
                  onClick={() => onEdit(role)}
                />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete role"
                  variant="destructive"
                  onClick={() => onDelete(role)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [canView, canUpdate, canDelete, onEdit, onManagePermissions, onDelete]
  );

  const filteredRoles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return roles.filter((role) => {
      const matchesSearch =
        !q ||
        role.name.toLowerCase().includes(q) ||
        (role.description ?? "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || role.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [roles, search, statusFilter]);

  const isFiltering = search.trim() !== "" || statusFilter !== "all";

  return (
    <DataTable
      columns={columns}
      data={filteredRoles}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(role) => String(role.id)}
      emptyIcon={ShieldCheck}
      emptyTitle={isFiltering ? "No matching roles" : "No roles found"}
      emptyDescription={
        isFiltering
          ? "Try adjusting your search or status filter."
          : "Create your first administrator role to start managing access."
      }
      emptyAction={
        !isFiltering && canCreate ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add Role
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
          search={<SearchInput value={search} onChange={onSearchChange} placeholder="Search roles…" />}
        />
      }
    />
  );
}
