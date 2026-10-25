"use client";

import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
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
import { notify } from "@/lib/toast";
import { treatmentSectionsKey } from "@/components/admin/treatments/TreatmentSectionsPanel";
import type { JourneySectionContent, WhyChooseUsIconKey } from "@/types/treatment-section";

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

const stepSchema = z.object({
  duration: z.string().trim().min(1, "Duration/badge text is required").max(100),
  title: z.string().trim().min(1, "Title is required").max(255),
  icon: z.enum(["stethoscope", "building", "heart", "message", "shield", "doctor", "hospital", "check"]),
  pointsText: z.string().trim().optional(),
});
const formSchema = z.object({ heading: z.string().trim().max(255).optional(), steps: z.array(stepSchema).max(12) });
type FormValues = z.infer<typeof formSchema>;

type TreatmentJourneyDialogProps = {
  open: boolean;
  treatmentId: number | null;
  treatmentName?: string;
  onOpenChange: (open: boolean) => void;
};

/**
 * Edits the ONE `journey` section row's content — the scroll-animated
 * Patient Treatment Journey timeline. Any number of steps; the public
 * component always treats the LAST one as the distinct discharge/
 * completed state, whatever its icon. Points are entered one per line.
 */
export function TreatmentJourneyDialog({ open, treatmentId, treatmentName, onOpenChange }: TreatmentJourneyDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Manage Patient Journey"
      description={treatmentName ? `Treatment: ${treatmentName}` : undefined}
      className="sm:max-w-2xl"
    >
      {open && treatmentId !== null && <TreatmentJourneyBody treatmentId={treatmentId} onOpenChange={onOpenChange} />}
    </FormDialog>
  );
}

function TreatmentJourneyBody({ treatmentId, onOpenChange }: { treatmentId: number; onOpenChange: (open: boolean) => void }) {
  const sectionsQuery = useQuery({ queryKey: treatmentSectionsKey(treatmentId), queryFn: () => listTreatmentSections(treatmentId) });
  const section = sectionsQuery.data?.sections.find((s) => s.section_type === "journey");

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
        {sectionsQuery.error instanceof ApiError ? sectionsQuery.error.message : "Failed to load content."}
      </p>
    );
  }

  return (
    <TreatmentJourneyForm
      key={section.id}
      treatmentId={treatmentId}
      sectionId={section.id}
      initialContent={section.content as JourneySectionContent | null}
      onOpenChange={onOpenChange}
    />
  );
}

function TreatmentJourneyForm({
  treatmentId,
  sectionId,
  initialContent,
  onOpenChange,
}: {
  treatmentId: number;
  sectionId: number;
  initialContent: JourneySectionContent | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      heading: initialContent?.heading ?? "",
      steps: (initialContent?.steps ?? []).map((step) => ({
        duration: step.duration,
        title: step.title,
        icon: step.icon,
        pointsText: (step.points ?? []).join("\n"),
      })),
    },
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: "steps" });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      updateTreatmentSection(treatmentId, sectionId, {
        content: {
          heading: values.heading || null,
          steps: values.steps.map((step) => ({
            duration: step.duration,
            title: step.title,
            icon: step.icon,
            points: (step.pointsText ?? "")
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean),
          })),
        },
      }),
    onSuccess: () => {
      notify.success("Patient Journey content saved.");
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

      <p className="text-helper text-muted-foreground">
        The last step is always shown with a distinct completed/discharge state on the public page.
      </p>

      <Field data-invalid={!!errors.heading || undefined}>
        <FieldLabel htmlFor="journey-heading">
          Heading <span className="text-muted-foreground">(optional)</span>
        </FieldLabel>
        <Input id="journey-heading" placeholder="What Happens During This Treatment?" {...register("heading")} />
        <FieldError errors={[errors.heading]} />
      </Field>

      <div className="flex flex-col gap-3">
        <FieldLabel>Steps</FieldLabel>
        {fields.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">No steps added yet.</p>
        ) : (
          fields.map((field, index) => (
            <div key={field.id} className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <span className="text-body-sm font-semibold text-foreground">
                  Step {index + 1}
                  {index === fields.length - 1 ? " (Discharge/Completed)" : ""}
                </span>
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
                    aria-label={`Remove step ${index + 1}`}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field data-invalid={!!errors.steps?.[index]?.duration || undefined}>
                  <FieldLabel htmlFor={`journey-duration-${index}`}>
                    Duration Badge <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input id={`journey-duration-${index}`} placeholder="Step 1 · 20–30 min" {...register(`steps.${index}.duration` as const)} />
                  <FieldError errors={[errors.steps?.[index]?.duration]} />
                </Field>

                <Field data-invalid={!!errors.steps?.[index]?.icon || undefined}>
                  <FieldLabel htmlFor={`journey-icon-${index}`}>Icon</FieldLabel>
                  <Controller
                    name={`steps.${index}.icon` as const}
                    control={control}
                    render={({ field: iconField }) => (
                      <Select value={iconField.value} onValueChange={iconField.onChange}>
                        <SelectTrigger id={`journey-icon-${index}`} className="w-full">
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
                  <FieldError errors={[errors.steps?.[index]?.icon]} />
                </Field>
              </div>

              <Field data-invalid={!!errors.steps?.[index]?.title || undefined}>
                <FieldLabel htmlFor={`journey-title-${index}`}>
                  Title <span className="text-destructive">*</span>
                </FieldLabel>
                <Input id={`journey-title-${index}`} {...register(`steps.${index}.title` as const)} />
                <FieldError errors={[errors.steps?.[index]?.title]} />
              </Field>

              <Field>
                <FieldLabel htmlFor={`journey-points-${index}`}>
                  Points <span className="text-muted-foreground">(one per line)</span>
                </FieldLabel>
                <Controller
                  name={`steps.${index}.pointsText` as const}
                  control={control}
                  render={({ field: pointsField }) => (
                    <Textarea id={`journey-points-${index}`} rows={3} placeholder={"One point per line"} {...pointsField} />
                  )}
                />
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
          onClick={() => append({ duration: "", title: "", icon: "check", pointsText: "" })}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add Step
        </Button>
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
