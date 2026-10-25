"use client";

import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/admin/FormDialog";
import { FormFieldGrid } from "@/components/admin/FormFieldGrid";
import { LoadingButton } from "@/components/admin/LoadingButton";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldError, FieldLabel, FieldSet } from "@/components/ui/field";
import { ApiError } from "@/lib/api/client";
import { createEvent, getEvent, updateEvent } from "@/lib/api/events";
import { notify } from "@/lib/toast";
import { eventsKeys } from "@/components/admin/events/queries";
import type { Event } from "@/types/event";

// Mirrors validators/event.validator.ts's createEventSchema exactly.
// event_time uses a plain "HH:mm" string (the <input type="time"> native
// shape), matching the validator's own accepted format.
const eventFormSchema = z.object({
  event_name: z.string().trim().min(1, "Event name is required").max(255, "Name is too long"),
  event_location: z.string().trim().max(255, "Location is too long").optional(),
  event_date: z.string().min(1, "Event date is required"),
  event_time: z.string().optional(),
  status: z.enum(["active", "inactive"]),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

type EventFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  eventId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function EventFormDialog({ open, mode, eventId, onOpenChange }: EventFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add Event" : "Edit Event"}
      description={mode === "create" ? "Create a new event." : "Update this event's details."}
    >
      {open && (
        <EventFormBody
          key={mode === "edit" ? (eventId ?? "edit") : "create"}
          mode={mode}
          eventId={eventId}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function EventFormBody({
  mode,
  eventId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  eventId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const eventQuery = useQuery({
    queryKey: eventsKeys.detail(eventId ?? -1),
    queryFn: () => getEvent(eventId as number),
    enabled: mode === "edit" && eventId !== null,
  });

  if (mode === "edit" && eventQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading event…
      </div>
    );
  }

  if (mode === "edit" && eventQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {eventQuery.error instanceof ApiError ? eventQuery.error.message : "Failed to load event."}
      </p>
    );
  }

  return (
    <EventForm mode={mode} eventId={eventId} initialEvent={eventQuery.data?.event} onOpenChange={onOpenChange} />
  );
}

/** Converts a stored ISO datetime into the `yyyy-MM-dd` shape `<input type="date">` needs. */
function toDateInputValue(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

/** event_time is stored as a full ISO datetime anchored to 1970-01-01 (UTC) — extracted here with the UTC timezone to avoid a local-timezone shift of the time-of-day value. */
function toTimeInputValue(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(11, 16);
}

function EventForm({
  mode,
  eventId,
  initialEvent,
  onOpenChange,
}: {
  mode: "create" | "edit";
  eventId: number | null;
  initialEvent?: Event;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      event_name: initialEvent?.event_name ?? "",
      event_location: initialEvent?.event_location ?? "",
      event_date: toDateInputValue(initialEvent?.event_date),
      event_time: toTimeInputValue(initialEvent?.event_time),
      status: initialEvent?.status === "inactive" ? "inactive" : "active",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: EventFormValues) => {
      const payload = {
        event_name: values.event_name,
        event_location: values.event_location ? values.event_location : null,
        event_date: values.event_date,
        event_time: values.event_time ? values.event_time : null,
        status: values.status,
      };
      if (mode === "create") {
        return createEvent(payload);
      }
      return updateEvent(eventId as number, payload);
    },
    onSuccess: () => {
      notify.success(mode === "create" ? "Event created successfully." : "Event updated successfully.");
      queryClient.invalidateQueries({ queryKey: eventsKeys.all });
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: EventFormValues) => {
    mutation.mutate(values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {mutation.isError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {mutation.error instanceof ApiError ? mutation.error.message : "Something went wrong."}
        </div>
      )}

      <FieldSet>
        <FormFieldGrid>
          <Field className="sm:col-span-2" data-invalid={!!errors.event_name || undefined}>
            <FieldLabel htmlFor="event-name">
              Event Name <span className="text-destructive">*</span>
            </FieldLabel>
            <Input id="event-name" aria-invalid={!!errors.event_name || undefined} {...register("event_name")} />
            <FieldError errors={[errors.event_name]} />
          </Field>

          <Field data-invalid={!!errors.event_location || undefined}>
            <FieldLabel htmlFor="event-location">
              Location <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="event-location" {...register("event_location")} />
            <FieldError errors={[errors.event_location]} />
          </Field>

          <Field data-invalid={!!errors.status || undefined}>
            <FieldLabel htmlFor="event-status">Status</FieldLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="event-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.status]} />
          </Field>

          <Field data-invalid={!!errors.event_date || undefined}>
            <FieldLabel htmlFor="event-date">
              Event Date <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="event-date"
              type="date"
              aria-invalid={!!errors.event_date || undefined}
              {...register("event_date")}
            />
            <FieldError errors={[errors.event_date]} />
          </Field>

          <Field data-invalid={!!errors.event_time || undefined}>
            <FieldLabel htmlFor="event-time">
              Event Time <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="event-time" type="time" {...register("event_time")} />
            <FieldError errors={[errors.event_time]} />
          </Field>
        </FormFieldGrid>
      </FieldSet>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting || mutation.isPending}
        >
          Cancel
        </Button>
        <LoadingButton type="submit" disabled={isSubmitting} loading={mutation.isPending}>
          {mode === "create" ? "Create Event" : "Save Changes"}
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
