"use client";

import { useMemo } from "react";
import { Eye, Pencil, Plus, Trash2, Users as UsersIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { User } from "@/types/user";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { FilterDropdown } from "@/components/admin/data-table/FilterDropdown";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { rolesKeys } from "@/components/admin/roles/queries";
import { listRoles } from "@/lib/api/roles";
import { formatDate } from "@/lib/format-date";

type UsersTableProps = {
  users: User[];
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
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  onCreate: () => void;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
};

export function UsersTable({
  users,
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
  roleFilter,
  onRoleFilterChange,
  onCreate,
  onView,
  onEdit,
  onDelete,
}: UsersTableProps) {
  // Role names aren't embedded in the Users API response (it only returns
  // role_id) — cross-referenced against the existing Roles list, which
  // React Query dedupes/caches against any other component fetching the
  // same "roles" query key (the role select in the form, etc.).
  const rolesQuery = useQuery({ queryKey: rolesKeys.all, queryFn: listRoles });
  const roleNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const role of rolesQuery.data?.roles ?? []) map.set(role.id, role.name);
    return map;
  }, [rolesQuery.data]);

  const columns = useMemo<LegacyColumnDef<User>[]>(
    () => [
      {
        id: "user",
        accessorKey: "name",
        header: "User",
        cell: ({ row }) => (
          <div className="flex max-w-xs flex-col gap-0.5 py-0.5">
            <span className="truncate text-table-body font-semibold text-foreground">
              {row.original.name}
            </span>
            <span className="truncate text-caption">{row.original.email}</span>
          </div>
        ),
      },
      {
        id: "role",
        accessorKey: "role_id",
        header: "Role",
        cell: ({ row }) => (
          <span className="text-body-sm text-foreground">
            {roleNameById.get(row.original.role_id) ?? `Role #${row.original.role_id}`}
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
          const user = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canView && (
                <TableActionButton
                  icon={Eye}
                  label="View"
                  ariaLabel="View user"
                  onClick={() => onView(user)}
                />
              )}
              {canUpdate && (
                <TableActionButton
                  icon={Pencil}
                  label="Edit"
                  ariaLabel="Edit user"
                  onClick={() => onEdit(user)}
                />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete user"
                  variant="destructive"
                  onClick={() => onDelete(user)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [roleNameById, canView, canUpdate, canDelete, onView, onEdit, onDelete]
  );

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !q || user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      const matchesRole = roleFilter === "all" || String(user.role_id) === roleFilter;
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, search, statusFilter, roleFilter]);

  const isFiltering = search.trim() !== "" || statusFilter !== "all" || roleFilter !== "all";

  const roleOptions = useMemo(
    () => [
      { label: "All roles", value: "all" },
      ...(rolesQuery.data?.roles ?? []).map((role) => ({ label: role.name, value: String(role.id) })),
    ],
    [rolesQuery.data]
  );

  return (
    <DataTable
      columns={columns}
      data={filteredUsers}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(user) => user.user_id}
      emptyIcon={UsersIcon}
      emptyTitle={isFiltering ? "No matching users" : "No users found"}
      emptyDescription={
        isFiltering
          ? "Try adjusting your search or filters."
          : "Create your first administrator user to get started."
      }
      emptyAction={
        !isFiltering && canCreate ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add User
          </Button>
        ) : undefined
      }
      toolbar={
        <FilterBar
          filters={
            <>
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
              <FilterDropdown
                label="Role"
                value={roleFilter}
                onChange={onRoleFilterChange}
                options={roleOptions}
              />
            </>
          }
          search={<SearchInput value={search} onChange={onSearchChange} placeholder="Search users…" />}
        />
      }
    />
  );
}
