import { z } from "zod";

export const eventStatusSchema = z.enum(["active", "inactive"]);

export const eventIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listEventsQuerySchema = z.object({
  status: eventStatusSchema.optional(),
});

// event_date (`@db.Date`, required): a date-only value. Accepts an ISO
// date string or Date instance; rejects anything that doesn't parse.
const requiredDateSchema = z
  .union([z.string(), z.date()])
  .transform((value, ctx) => {
    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "event_date must be a valid date",
      });
      return z.NEVER;
    }

    return date;
  });

// event_time (`@db.Time(0)`, optional): a MySQL TIME column — only the
// time-of-day is ever stored, the date portion is discarded by MySQL,
// but Prisma's generated type still requires a Date object as input.
// Rather than accepting a full DateTime string (which would wrongly
// suggest the date portion matters), this accepts a plain time string
// ("HH:mm" or "HH:mm:ss") and anchors it to a neutral date. Same
// three-state convention used elsewhere for nullable date/media fields:
// undefined = leave unchanged, "" = clear, invalid = 400.
const timeOnlyPattern = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

const nullableTimeSchema = z
  .string()
  .nullable()
  .transform((value, ctx) => {
    if (value === null || value === "") {
      return null;
    }

    if (!timeOnlyPattern.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "event_time must be a valid time in HH:mm or HH:mm:ss format",
      });
      return z.NEVER;
    }

    const [hours, minutes, seconds] = value.split(":").map(Number);

    return new Date(Date.UTC(1970, 0, 1, hours, minutes, seconds ?? 0));
  });

export const createEventSchema = z.object({
  event_name: z.string().trim().min(1, "Event name is required").max(255),
  event_location: z.string().trim().max(255).nullable().optional(),
  event_date: requiredDateSchema,
  event_time: nullableTimeSchema.optional(),
  status: eventStatusSchema.optional(),
});

export const updateEventSchema = createEventSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type EventIdParam = z.infer<typeof eventIdParamSchema>;
export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;
