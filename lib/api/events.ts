import { apiFetch } from "./client";
import type {
  CreateEventInput,
  Event,
  ListEventsFilter,
  UpdateEventInput,
} from "@/types/event";

type EventsListResponse = { success: true; events: Event[] };
type EventResponse = { success: true; event: Event };
type DeleteEventResponse = { success: true; message: string };

function toQueryString(filter?: ListEventsFilter): string {
  if (!filter?.status) return "";
  return `?status=${filter.status}`;
}

export function listEvents(filter?: ListEventsFilter) {
  return apiFetch<EventsListResponse>(`/api/events${toQueryString(filter)}`);
}

export function getEvent(id: number) {
  return apiFetch<EventResponse>(`/api/events/${id}`);
}

export function createEvent(data: CreateEventInput) {
  return apiFetch<EventResponse>("/api/events", { method: "POST", body: data });
}

export function updateEvent(id: number, data: UpdateEventInput) {
  return apiFetch<EventResponse>(`/api/events/${id}`, { method: "PUT", body: data });
}

/** Soft delete — sets status to "inactive". */
export function deleteEvent(id: number) {
  return apiFetch<DeleteEventResponse>(`/api/events/${id}`, { method: "DELETE" });
}
