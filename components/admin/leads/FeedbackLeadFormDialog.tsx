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
import { updateFeedbackLead } from "@/lib/api/leads";
import { notify } from "@/lib/toast";
import { leadsKeys } from "@/components/admin/leads/queries";
import type { FeedbackLead } from "@/types/lead";

// Mirrors validators/feedback-lead.validator.ts's updateFeedbackLeadSchema exactly.
const feedbackLeadFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150, "Name is too long"),
  email: z.string().trim().min(1, "Email is required").max(255, "Email is too long").email("Enter a valid email address"),
  phone_number: z.string().trim().min(1, "Phone number is required").max(30, "Phone number is too long"),
  hospital_location: z.string().trim().max(255, "Hospital / location is too long").optional(),
});

type FeedbackLeadFormValues = z.infer<typeof feedbackLeadFormSchema>;

type FeedbackLeadFormDialogProps = {
  lead: FeedbackLead | null;
  onClose: () => void;
};

export function FeedbackLeadFormDialog({ lead, onClose }: FeedbackLeadFormDialogProps) {
  return (
    <FormDialog
      open={!!lead}
      onOpenChange={(open) => !open && onClose()}
      title="Edit Feedback Lead"
      description="Update this lead's contact details."
    >
      {lead && <FeedbackLeadForm key={lead.id} lead={lead} onClose={onClose} />}
    </FormDialog>
  );
}

function FeedbackLeadForm({ lead, onClose }: { lead: FeedbackLead; onClose: () => void }) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FeedbackLeadFormValues>({
    resolver: zodResolver(feedbackLeadFormSchema),
    defaultValues: {
      name: lead.name,
      email: lead.email,
      phone_number: lead.phone_number,
      hospital_location: lead.hospital_location ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FeedbackLeadFormValues) =>
      updateFeedbackLead(lead.id, {
        ...values,
        hospital_location: values.hospital_location ? values.hospital_location : null,
      }),
    onSuccess: () => {
      notify.success("Feedback lead updated successfully.");
      queryClient.invalidateQueries({ queryKey: leadsKeys.feedback });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: FeedbackLeadFormValues) => {
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
        <Field data-invalid={!!errors.name || undefined}>
          <FieldLabel htmlFor="feedback-lead-name">
            Name <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="feedback-lead-name"
            aria-invalid={!!errors.name || undefined}
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field data-invalid={!!errors.email || undefined}>
          <FieldLabel htmlFor="feedback-lead-email">
            Email <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="feedback-lead-email"
            type="email"
            aria-invalid={!!errors.email || undefined}
            {...register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <Field data-invalid={!!errors.phone_number || undefined}>
          <FieldLabel htmlFor="feedback-lead-phone">
            Phone Number <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="feedback-lead-phone"
            aria-invalid={!!errors.phone_number || undefined}
            {...register("phone_number")}
          />
          <FieldError errors={[errors.phone_number]} />
        </Field>

        <Field data-invalid={!!errors.hospital_location || undefined}>
          <FieldLabel htmlFor="feedback-lead-hospital">
            Hospital / Location <span className="text-muted-foreground">(optional)</span>
          </FieldLabel>
          <Input
            id="feedback-lead-hospital"
            aria-invalid={!!errors.hospital_location || undefined}
            {...register("hospital_location")}
          />
          <FieldError errors={[errors.hospital_location]} />
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
