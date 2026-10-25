export type EventStatus = "active" | "inactive";

/**
 * Mirrors services/event.service.ts's raw Prisma return — no select
 * clause, no relations (events_calendar has none). `event_time` is a
 * MySQL TIME column stored/serialized as a full ISO datetime string
 * anchored to 1970-01-01 (per validators/event.validator.ts's own
 * documented convention) — only the time-of-day portion is meaningful.
 */
export type Event = {
  id: number;
  event_name: string;
  event_location: string | null;
  event_date: string;
  event_time: string | null;
  status: EventStatus;
  created_at: string;
  updated_at: string;
};

/** Mirrors validators/event.validator.ts's listEventsQuerySchema. */
export type ListEventsFilter = {
  status?: EventStatus;
};

/** Mirrors validators/event.validator.ts's createEventSchema — `event_time` is submitted as a plain "HH:mm" or "HH:mm:ss" string, not a full datetime. */
export type CreateEventInput = {
  event_name: string;
  event_location?: string | null;
  event_date: string;
  event_time?: string | null;
  status?: EventStatus;
};

export type UpdateEventInput = Partial<CreateEventInput>;
