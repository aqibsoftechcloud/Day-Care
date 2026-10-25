"use client";

import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/admin/FormDialog";
import { LoadingButton } from "@/components/admin/LoadingButton";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { ApiError } from "@/lib/api/client";
import { listTreatmentSections, updateTreatmentSection } from "@/lib/api/treatment-sections";
import { ctaSectionContentSchema } from "@/validators/treatment-section.validator";
import { notify } from "@/lib/toast";
import { treatmentSectionsKey } from "@/components/admin/treatments/TreatmentSectionsPanel";
import type { CtaSectionContent, WhyChooseUsIconKey } from "@/types/treatment-section";

type TreatmentFinalCtaDialogProps = {
  open: boolean;
  treatmentId: number | null;
  treatmentName?: string;
  onOpenChange: (open: boolean) => void;
};

/** Same controlled icon allowlist as Why Choose Us — own local copy per this codebase's established convention. */
const ICON_OPTIONS: { value: WhyChooseUsIconKey; label: string }[] = [
  { value: "stethoscope", label: "Stethoscope" },
  { value: "building", label: "Building" },
  { value: "heart", label: "Heart" },
  { value: "message", label: "Message" },
  { value: "shield", label: "Shield" },
  { value: "doctor", label: "Doctor" },
  { value: "hospital", label: "Hospital" },
  { value: "check", label: "Check" },
];

type FormValues = CtaSectionContent;

/** Edits the ONE `cta` section row's content — mirrors `SpecialityFinalCtaDialog.tsx` exactly, own independent `treatment_sections` data source. */
export function TreatmentFinalCtaDialog({ open, treatmentId, treatmentName, onOpenChange }: TreatmentFinalCtaDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Manage Final CTA"
      description={treatmentName ? `Treatment: ${treatmentName}` : undefined}
      className="sm:max-w-2xl"
    >
      {open && treatmentId !== null && <TreatmentFinalCtaBody treatmentId={treatmentId} onOpenChange={onOpenChange} />}
    </FormDialog>
  );
}

function TreatmentFinalCtaBody({ treatmentId, onOpenChange }: { treatmentId: number; onOpenChange: (open: boolean) => void }) {
  const sectionsQuery = useQuery({
    queryKey: treatmentSectionsKey(treatmentId),
    queryFn: () => listTreatmentSections(treatmentId),
  });

  const section = sectionsQuery.data?.sections.find((s) => s.section_type === "cta");

  if (sectionsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading…
      </div>
    );
  }

  if (sectionsQuery.isError || !section) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {sectionsQuery.error instanceof ApiError ? sectionsQuery.error.message : "Failed to load Final CTA content."}
      </p>
    );
  }

  return (
    <TreatmentFinalCtaForm
      key={section.id}
      treatmentId={treatmentId}
      sectionId={section.id}
      initialContent={section.content as CtaSectionContent | null}
      onOpenChange={onOpenChange}
    />
  );
}

function TreatmentFinalCtaForm({
  treatmentId,
  sectionId,
  initialContent,
  onOpenChange,
}: {
  treatmentId: number;
  sectionId: number;
  initialContent: CtaSectionContent | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(ctaSectionContentSchema),
    defaultValues: {
      heading: initialContent?.heading ?? "",
      description: initialContent?.description ?? "",
      items: initialContent?.items ?? [],
      button_text: initialContent?.button_text ?? "",
      button_url: initialContent?.button_url ?? "",
    },
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: "items" });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => updateTreatmentSection(treatmentId, sectionId, { content: values }),
    onSuccess: () => {
      notify.success("Final CTA content saved.");
      queryClient.invalidateQueries({ queryKey: treatmentSectionsKey(treatmentId) });
      onOpenChange(false);
    },
    onError: (error) => notify.apiError(error),
  });

  const onSubmit = (values: FormValues) => mutation.mutate(values);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {mutation.isError && (
        <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {mutation.error instanceof ApiError ? mutation.error.message : "Something went wrong."}
        </div>
      )}

      <p className="text-helper text-muted-foreground">Leave a field blank to keep the default wording already shown on the public page.</p>

      <Field data-invalid={!!errors.heading || undefined}>
        <FieldLabel htmlFor="tfc-heading">
          Heading <span className="text-muted-foreground">(optional)</span>
        </FieldLabel>
        <Input id="tfc-heading" placeholder="Need help with this treatment?" {...register("heading")} />
        <FieldError errors={[errors.heading]} />
      </Field>

      <Field data-invalid={!!errors.description || undefined}>
        <FieldLabel htmlFor="tfc-description">
          Description <span className="text-muted-foreground">(optional)</span>
        </FieldLabel>
        <Textarea id="tfc-description" rows={2} {...register("description")} />
        <FieldError errors={[errors.description]} />
      </Field>

      <div className="flex flex-col gap-3">
        <FieldLabel>
          Support Points <span className="text-muted-foreground">(optional)</span>
        </FieldLabel>
        {fields.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">No support points added yet.</p>
        ) : (
          fields.map((field, index) => (
            <div key={field.id} className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <span className="text-body-sm font-semibold text-foreground">Support Point {index + 1}</span>
                <div className="flex items-center gap-0.5">
                  <Button type="button" variant="ghost" size="icon-sm" disabled={index === 0} onClick={() => move(index, index - 1)} aria-label="Move up">
                    <ChevronUp className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={index === fields.length - 1}
                    onClick={() => move(index, index + 1)}
                    aria-label="Move down"
                  >
                    <ChevronDown className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => remove(index)}
                    aria-label={`Remove support point ${index + 1}`}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <Field data-invalid={!!errors.items?.[index]?.icon_key || undefined}>
                <FieldLabel htmlFor={`tfc-icon-${index}`}>Icon</FieldLabel>
                <Controller
                  name={`items.${index}.icon_key` as const}
                  control={control}
                  render={({ field: iconField }) => (
                    <Select value={iconField.value} onValueChange={iconField.onChange}>
                      <SelectTrigger id={`tfc-icon-${index}`} className="w-full sm:w-56">
                        <SelectValue placeholder="Select an icon" />
                      </SelectTrigger>
                      <SelectContent>
                        {ICON_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.items?.[index]?.icon_key]} />
              </Field>

              <Field data-invalid={!!errors.items?.[index]?.title || undefined}>
                <FieldLabel htmlFor={`tfc-title-${index}`}>
                  Title <span className="text-destructive">*</span>
                </FieldLabel>
                <Input id={`tfc-title-${index}`} {...register(`items.${index}.title` as const)} />
                <FieldError errors={[errors.items?.[index]?.title]} />
              </Field>

              <Field data-invalid={!!errors.items?.[index]?.description || undefined}>
                <FieldLabel htmlFor={`tfc-item-description-${index}`}>
                  Description <span className="text-destructive">*</span>
                </FieldLabel>
                <Textarea id={`tfc-item-description-${index}`} rows={2} {...register(`items.${index}.description` as const)} />
                <FieldError errors={[errors.items?.[index]?.description]} />
              </Field>
            </div>
          ))
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          disabled={fields.length >= 12}
          onClick={() => append({ icon_key: "check", title: "", description: "" })}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add Support Point
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field data-invalid={!!errors.button_text || undefined}>
          <FieldLabel htmlFor="tfc-button-text">
            Button Text <span className="text-muted-foreground">(optional)</span>
          </FieldLabel>
          <Input id="tfc-button-text" placeholder="Book an Appointment" {...register("button_text")} />
          <FieldError errors={[errors.button_text]} />
        </Field>
        <Field data-invalid={!!errors.button_url || undefined}>
          <FieldLabel htmlFor="tfc-button-url">
            Button URL <span className="text-muted-foreground">(optional)</span>
          </FieldLabel>
          <Input id="tfc-button-url" placeholder="/contact-us" {...register("button_url")} />
          <FieldError errors={[errors.button_url]} />
        </Field>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting || mutation.isPending}>
          Cancel
        </Button>
        <LoadingButton type="submit" disabled={isSubmitting} loading={mutation.isPending}>
          Save Changes
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
