"use client";

import { DetailSheet } from "@/components/admin/DetailSheet";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format-date";
import type { Event } from "@/types/event";

/** event_time is stored as a full ISO datetime anchored to 1970-01-01 — parsed with the UTC timezone to avoid a local-timezone shift of the time-of-day value. */
function formatEventTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
}

type EventViewDialogProps = {
  event: Event | null;
  onClose: () => void;
};

export function EventViewDialog({ event, onClose }: EventViewDialogProps) {
  if (!event) return null;

  return (
    <DetailSheet
      open={!!event}
      onClose={onClose}
      title="Event Details"
      description={event.event_name}
      sections={[
        {
          heading: "Event Information",
          rows: [
            { label: "Event Name", value: event.event_name },
            { label: "Location", value: event.event_location || "—" },
            { label: "Event Date", value: formatDate(event.event_date) },
            { label: "Event Time", value: formatEventTime(event.event_time) },
            { label: "Status", value: <StatusBadge status={event.status} /> },
          ],
        },
        {
          heading: "Timestamps",
          rows: [
            { label: "Created", value: formatDate(event.created_at) },
            { label: "Updated", value: formatDate(event.updated_at) },
          ],
        },
      ]}
    />
  );
}
