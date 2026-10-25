"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/admin/FormDialog";
import { LoadingButton } from "@/components/admin/LoadingButton";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { ApiError } from "@/lib/api/client";
import { updateAppointmentLead } from "@/lib/api/leads";
import { notify } from "@/lib/toast";
import { leadsKeys } from "@/components/admin/leads/queries";
import type { AppointmentLead } from "@/types/lead";

// Mirrors validators/appointment-lead.validator.ts's updateAppointmentLeadSchema exactly.
const appointmentLeadFormSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(100, "First name is too long"),
  last_name: z.string().trim().max(100, "Last name is too long"),
  email: z.union([z.literal(""), z.string().trim().max(255, "Email is too long").email("Enter a valid email address")]),
  phone_number: z.string().trim().min(1, "Phone number is required").max(30, "Phone number is too long"),
});

type AppointmentLeadFormValues = z.infer<typeof appointmentLeadFormSchema>;

type AppointmentLeadFormDialogProps = {
  lead: AppointmentLead | null;
  onClose: () => void;
};

export function AppointmentLeadFormDialog({ lead, onClose }: AppointmentLeadFormDialogProps) {
  return (
    <FormDialog
      open={!!lead}
      onOpenChange={(open) => !open && onClose()}
      title="Edit Appointment Lead"
      description="Update this lead's contact details."
    >
      {/* Keyed by lead id so switching targets remounts with fresh defaultValues. */}
      {lead && <AppointmentLeadForm key={lead.id} lead={lead} onClose={onClose} />}
    </FormDialog>
  );
}

function AppointmentLeadForm({ lead, onClose }: { lead: AppointmentLead; onClose: () => void }) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentLeadFormValues>({
    resolver: zodResolver(appointmentLeadFormSchema),
    defaultValues: {
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
      phone_number: lead.phone_number,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: AppointmentLeadFormValues) => updateAppointmentLead(lead.id, values),
    onSuccess: () => {
      notify.success("Appointment lead updated successfully.");
      queryClient.invalidateQueries({ queryKey: leadsKeys.appointments });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: AppointmentLeadFormValues) => {
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

      <FieldGroup className="gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.first_name || undefined}>
            <FieldLabel htmlFor="appointment-lead-first-name">
              First Name <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="appointment-lead-first-name"
              aria-invalid={!!errors.first_name || undefined}
              {...register("first_name")}
            />
            <FieldError errors={[errors.first_name]} />
          </Field>

          <Field data-invalid={!!errors.last_name || undefined}>
            <FieldLabel htmlFor="appointment-lead-last-name">
              Last Name <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input
              id="appointment-lead-last-name"
              aria-invalid={!!errors.last_name || undefined}
              {...register("last_name")}
            />
            <FieldError errors={[errors.last_name]} />
          </Field>
        </div>

        <Field data-invalid={!!errors.email || undefined}>
          <FieldLabel htmlFor="appointment-lead-email">
            Email <span className="text-muted-foreground">(optional)</span>
          </FieldLabel>
          <Input
            id="appointment-lead-email"
            type="email"
            aria-invalid={!!errors.email || undefined}
            {...register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <Field data-invalid={!!errors.phone_number || undefined}>
          <FieldLabel htmlFor="appointment-lead-phone">
            Phone Number <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="appointment-lead-phone"
            aria-invalid={!!errors.phone_number || undefined}
            {...register("phone_number")}
          />
          <FieldError errors={[errors.phone_number]} />
        </Field>
      </FieldGroup>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting || mutation.isPending}
        >
          Cancel
        </Button>
        <LoadingButton type="submit" disabled={isSubmitting} loading={mutation.isPending}>
          Save Changes
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
