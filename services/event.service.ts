import { prisma } from "@/lib/prisma";
import type {
  CreateEventInput,
  ListEventsQuery,
  UpdateEventInput,
} from "@/validators/event.validator";

export class EventNotFoundError extends Error {
  constructor(id: number) {
    super(`Event with id ${id} not found`);
    this.name = "EventNotFoundError";
  }
}

/**
 * Ordered chronologically by event_date ascending (soonest first), with
 * id as a deterministic tie-breaker. This table has no sorting_order
 * field and no other explicit ordering requirement, but event_date is
 * the calendar's own natural listing order and is the only field this
 * schema specifically indexes for query purposes — a design decision,
 * not an invented field.
 */
export function getEvents(filter?: ListEventsQuery) {
  return prisma.events_calendar.findMany({
    where:
      filter?.status !== undefined ? { status: filter.status } : undefined,
    orderBy: [{ event_date: "asc" }, { id: "asc" }],
  });
}

export async function getEventById(id: number) {
  const event = await prisma.events_calendar.findUnique({ where: { id } });

  if (!event) {
    throw new EventNotFoundError(id);
  }

  return event;
}

export function createEvent(data: CreateEventInput) {
  return prisma.events_calendar.create({ data });
}

export async function updateEvent(id: number, data: UpdateEventInput) {
  await getEventById(id);

  return prisma.events_calendar.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
  });
}

/**
 * Soft delete: deactivates the event by setting status to "inactive".
 */
export async function deleteEvent(id: number) {
  await getEventById(id);

  await prisma.events_calendar.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
