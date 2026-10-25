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
import { updateInternationalPatientLead } from "@/lib/api/leads";
import { notify } from "@/lib/toast";
import { leadsKeys } from "@/components/admin/leads/queries";
import type { InternationalPatientLead } from "@/types/lead";

// Mirrors validators/international-patient-lead.validator.ts's updateInternationalPatientLeadSchema exactly.
const internationalPatientLeadFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150, "Name is too long"),
  age: z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) <= 150), "Enter a valid age")
    .optional(),
  gender: z.string().trim().max(50, "Gender is too long").optional(),
  country: z.string().trim().max(100, "Country is too long").optional(),
});

type InternationalPatientLeadFormValues = z.infer<typeof internationalPatientLeadFormSchema>;

type InternationalPatientLeadFormDialogProps = {
  lead: InternationalPatientLead | null;
  onClose: () => void;
};

export function InternationalPatientLeadFormDialog({
  lead,
  onClose,
}: InternationalPatientLeadFormDialogProps) {
  return (
    <FormDialog
      open={!!lead}
      onOpenChange={(open) => !open && onClose()}
      title="Edit International Patient Lead"
      description="Update this lead's details."
    >
      {lead && <InternationalPatientLeadForm key={lead.id} lead={lead} onClose={onClose} />}
    </FormDialog>
  );
}

function InternationalPatientLeadForm({
  lead,
  onClose,
}: {
  lead: InternationalPatientLead;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InternationalPatientLeadFormValues>({
    resolver: zodResolver(internationalPatientLeadFormSchema),
    defaultValues: {
      name: lead.name,
      age: lead.age !== null ? String(lead.age) : "",
      gender: lead.gender ?? "",
      country: lead.country ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: InternationalPatientLeadFormValues) =>
      updateInternationalPatientLead(lead.id, {
        name: values.name,
        age: values.age && values.age !== "" ? Number(values.age) : null,
        gender: values.gender ? values.gender : null,
        country: values.country ? values.country : null,
      }),
    onSuccess: () => {
      notify.success("International patient lead updated successfully.");
      queryClient.invalidateQueries({ queryKey: leadsKeys.internationalPatients });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: InternationalPatientLeadFormValues) => {
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
          <FieldLabel htmlFor="intl-lead-name">
            Name <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="intl-lead-name"
            aria-invalid={!!errors.name || undefined}
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.age || undefined}>
            <FieldLabel htmlFor="intl-lead-age">
              Age <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input
              id="intl-lead-age"
              inputMode="numeric"
              aria-invalid={!!errors.age || undefined}
              {...register("age")}
            />
            <FieldError errors={[errors.age]} />
          </Field>

          <Field data-invalid={!!errors.gender || undefined}>
            <FieldLabel htmlFor="intl-lead-gender">
              Gender <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input
              id="intl-lead-gender"
              aria-invalid={!!errors.gender || undefined}
              {...register("gender")}
            />
            <FieldError errors={[errors.gender]} />
          </Field>
        </div>

        <Field data-invalid={!!errors.country || undefined}>
          <FieldLabel htmlFor="intl-lead-country">
            Country <span className="text-muted-foreground">(optional)</span>
          </FieldLabel>
          <Input
            id="intl-lead-country"
            aria-invalid={!!errors.country || undefined}
            {...register("country")}
          />
          <FieldError errors={[errors.country]} />
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
