"use client";

import { useState } from "react";
import { Plus, ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { EventsTable } from "@/components/admin/events/EventsTable";
import { EventFormDialog } from "@/components/admin/events/EventFormDialog";
import { EventViewDialog } from "@/components/admin/events/EventViewDialog";
import { DeleteEventDialog } from "@/components/admin/events/DeleteEventDialog";
import { eventsKeys } from "@/components/admin/events/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listEvents } from "@/lib/api/events";
import type { Event } from "@/types/event";

export default function EventsPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("events-and-calendar");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formModal, setFormModal] = useState<{ mode: "create" } | { mode: "edit"; eventId: number } | null>(null);
  const [viewTarget, setViewTarget] = useState<Event | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);

  const eventsQuery = useQuery({
    queryKey: eventsKeys.all,
    queryFn: () => listEvents(),
    enabled: hasViewAccess,
  });

  if (!hasViewAccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card px-6 py-20 text-center shadow-xs">
        <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShieldOff className="size-5" aria-hidden="true" />
        </span>
        <p className="text-subtitle text-foreground">Access restricted</p>
        <p className="mt-1 max-w-sm text-body-sm text-muted-foreground">
          You don&apos;t have permission to view Events & Calendar.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Events & Calendar"
        description="Manage events shown on the website's calendar."
        action={
          canCreate("events-and-calendar") && (
            <Button onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add Event
            </Button>
          )
        }
      />

      <EventsTable
        events={eventsQuery.data?.events ?? []}
        loading={eventsQuery.isLoading}
        error={
          eventsQuery.isError
            ? eventsQuery.error instanceof ApiError
              ? eventsQuery.error.message
              : "Unable to load events. Please try again."
            : null
        }
        onRetry={() => eventsQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={canUpdate("events-and-calendar")}
        canDelete={canDelete("events-and-calendar")}
        canCreate={canCreate("events-and-calendar")}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onCreate={() => setFormModal({ mode: "create" })}
        onView={(event) => setViewTarget(event)}
        onEdit={(event) => setFormModal({ mode: "edit", eventId: event.id })}
        onDelete={(event) => setDeleteTarget(event)}
      />

      <EventFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        eventId={formModal?.mode === "edit" ? formModal.eventId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <EventViewDialog event={viewTarget} onClose={() => setViewTarget(null)} />

      <DeleteEventDialog event={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
