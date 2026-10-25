"use client";

import { useMemo } from "react";
import { Eye, ListTree, Pencil, Plus, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { Menu } from "@/types/menu";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { FilterDropdown } from "@/components/admin/data-table/FilterDropdown";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";

type MenusTableProps = {
  menus: Menu[];
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
  onView: (menu: Menu) => void;
  onEdit: (menu: Menu) => void;
  onDelete: (menu: Menu) => void;
};

export function MenusTable({
  menus,
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
}: MenusTableProps) {
  const columns = useMemo<LegacyColumnDef<Menu>[]>(
    () => [
      {
        id: "title",
        accessorKey: "title",
        header: "Menu",
        cell: ({ row }) => (
          <div className="flex max-w-xs flex-col gap-0.5 py-0.5">
            <span className="flex items-center gap-1.5 truncate text-table-body font-semibold text-foreground">
              {row.original.parent && <span className="text-muted-foreground/60">↳</span>}
              {row.original.title}
            </span>
            <span className="truncate text-caption">
              {row.original.parent ? `Under "${row.original.parent.title}"` : "Top-level"}
            </span>
          </div>
        ),
      },
      {
        id: "language_city",
        header: "Language / City",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5 py-0.5 text-body-sm">
            <span className="text-foreground">{row.original.language.name}</span>
            <span className="text-caption">{row.original.city ? row.original.city.city_name : "Global"}</span>
          </div>
        ),
      },
      {
        id: "target",
        header: "Links To",
        enableSorting: false,
        cell: ({ row }) => {
          const menu = row.original;
          if (menu.target_type === "none") {
            return <span className="text-body-sm text-muted-foreground">Group only</span>;
          }
          if (!menu.target) {
            return <span className="text-body-sm text-destructive">Target missing</span>;
          }
          return (
            <div className="flex flex-col gap-0.5 py-0.5 text-body-sm">
              <span className="text-foreground">{menu.target.label}</span>
              <span className="text-caption capitalize">{menu.target_type.replace("_", " ")}</span>
            </div>
          );
        },
      },
      {
        id: "placement",
        header: "Placement",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-body-sm text-foreground capitalize">
            {row.original.parent ? "—" : row.original.placement}
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
          const menu = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canView && (
                <TableActionButton icon={Eye} label="View" ariaLabel="View menu" onClick={() => onView(menu)} />
              )}
              {canUpdate && (
                <TableActionButton icon={Pencil} label="Edit" ariaLabel="Edit menu" onClick={() => onEdit(menu)} />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete menu"
                  variant="destructive"
                  onClick={() => onDelete(menu)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [canView, canUpdate, canDelete, onView, onEdit, onDelete]
  );

  const filteredMenus = useMemo(() => {
    const q = search.trim().toLowerCase();
    return menus.filter((menu) => {
      const matchesSearch = !q || menu.title.toLowerCase().includes(q) || menu.seo_url.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || menu.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [menus, search, statusFilter]);

  const isFiltering = search.trim() !== "" || statusFilter !== "all";

  return (
    <DataTable
      columns={columns}
      data={filteredMenus}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(menu) => String(menu.id)}
      emptyIcon={ListTree}
      emptyTitle={isFiltering ? "No matching menus" : "No menus found"}
      emptyDescription={
        isFiltering
          ? "Try adjusting your search or status filter."
          : "Create your first menu item to start building navigation."
      }
      emptyAction={
        !isFiltering && canCreate ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add Menu
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
          search={<SearchInput value={search} onChange={onSearchChange} placeholder="Search menus…" />}
        />
      }
    />
  );
}
