"use client";

import { useMemo } from "react";
import { CalendarDays, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { Event } from "@/types/event";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FilterBar } from "@/components/admin/data-table/FilterBar";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { FilterDropdown } from "@/components/admin/data-table/FilterDropdown";
import { TableActionButton } from "@/components/admin/data-table/TableActionButton";
import { formatDate } from "@/lib/format-date";

/** `event_time` is a MySQL TIME column serialized as an ISO datetime anchored to 1970-01-01 — parsed with the UTC timezone to avoid a local-timezone shift of the stored time-of-day. */
function formatEventTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
}

type EventsTableProps = {
  events: Event[];
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
  onView: (event: Event) => void;
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
};

export function EventsTable({
  events,
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
}: EventsTableProps) {
  const columns = useMemo<LegacyColumnDef<Event>[]>(
    () => [
      {
        id: "event_name",
        accessorKey: "event_name",
        header: "Event",
        cell: ({ row }) => (
          <span className="max-w-xs truncate text-table-body font-semibold text-foreground">
            {row.original.event_name}
          </span>
        ),
      },
      {
        id: "event_location",
        header: "Location",
        cell: ({ row }) => <span className="text-body-sm text-foreground">{row.original.event_location || "—"}</span>,
      },
      {
        id: "event_date",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-body-sm text-muted-foreground">{formatDate(row.original.event_date)}</span>
        ),
      },
      {
        id: "event_time",
        header: "Time",
        cell: ({ row }) => (
          <span className="text-body-sm text-muted-foreground">{formatEventTime(row.original.event_time)}</span>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const event = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canView && (
                <TableActionButton icon={Eye} label="View" ariaLabel="View event" onClick={() => onView(event)} />
              )}
              {canUpdate && (
                <TableActionButton icon={Pencil} label="Edit" ariaLabel="Edit event" onClick={() => onEdit(event)} />
              )}
              {canDelete && (
                <TableActionButton
                  icon={Trash2}
                  label="Delete"
                  ariaLabel="Delete event"
                  variant="destructive"
                  onClick={() => onDelete(event)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [canView, canUpdate, canDelete, onView, onEdit, onDelete]
  );

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((event) => {
      const matchesSearch =
        !q ||
        event.event_name.toLowerCase().includes(q) ||
        (event.event_location ?? "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || event.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [events, search, statusFilter]);

  const isFiltering = search.trim() !== "" || statusFilter !== "all";

  return (
    <DataTable
      columns={columns}
      data={filteredEvents}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(event) => String(event.id)}
      emptyIcon={CalendarDays}
      emptyTitle={isFiltering ? "No matching events" : "No events found"}
      emptyDescription={
        isFiltering ? "Try adjusting your search or status filter." : "Create your first event to get started."
      }
      emptyAction={
        !isFiltering && canCreate ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add Event
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
          search={<SearchInput value={search} onChange={onSearchChange} placeholder="Search events…" />}
        />
      }
    />
  );
}
