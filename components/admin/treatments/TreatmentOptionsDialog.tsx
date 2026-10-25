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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { ApiError } from "@/lib/api/client";
import { listTreatmentSections, updateTreatmentSection } from "@/lib/api/treatment-sections";
import { notify } from "@/lib/toast";
import { treatmentSectionsKey } from "@/components/admin/treatments/TreatmentSectionsPanel";
import type { OptionsSectionContent } from "@/types/treatment-section";

const itemSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  description: z.string().trim().min(1, "Description is required").max(500),
  pointsText: z.string().trim().optional(),
});
const formSchema = z.object({ heading: z.string().trim().max(255).optional(), items: z.array(itemSchema).max(6) });
type FormValues = z.infer<typeof formSchema>;

type TreatmentOptionsDialogProps = {
  open: boolean;
  treatmentId: number | null;
  treatmentName?: string;
  onOpenChange: (open: boolean) => void;
};

/** Edits the ONE `options` section row's content ("Types of Treatment"). Each item's key points are entered as one point per line, split/joined on save. */
export function TreatmentOptionsDialog({ open, treatmentId, treatmentName, onOpenChange }: TreatmentOptionsDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Manage Types / Options"
      description={treatmentName ? `Treatment: ${treatmentName}` : undefined}
      className="sm:max-w-2xl"
    >
      {open && treatmentId !== null && <TreatmentOptionsBody treatmentId={treatmentId} onOpenChange={onOpenChange} />}
    </FormDialog>
  );
}

function TreatmentOptionsBody({ treatmentId, onOpenChange }: { treatmentId: number; onOpenChange: (open: boolean) => void }) {
  const sectionsQuery = useQuery({ queryKey: treatmentSectionsKey(treatmentId), queryFn: () => listTreatmentSections(treatmentId) });
  const section = sectionsQuery.data?.sections.find((s) => s.section_type === "options");

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
    <TreatmentOptionsForm
      key={section.id}
      treatmentId={treatmentId}
      sectionId={section.id}
      initialContent={section.content as OptionsSectionContent | null}
      onOpenChange={onOpenChange}
    />
  );
}

function TreatmentOptionsForm({
  treatmentId,
  sectionId,
  initialContent,
  onOpenChange,
}: {
  treatmentId: number;
  sectionId: number;
  initialContent: OptionsSectionContent | null;
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
      items: (initialContent?.items ?? []).map((item) => ({
        title: item.title,
        description: item.description,
        pointsText: (item.points ?? []).join("\n"),
      })),
    },
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: "items" });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      updateTreatmentSection(treatmentId, sectionId, {
        content: {
          heading: values.heading || null,
          items: values.items.map((item) => ({
            title: item.title,
            description: item.description,
            points: (item.pointsText ?? "")
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean),
          })),
        },
      }),
    onSuccess: () => {
      notify.success("Types/Options content saved.");
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

      <Field data-invalid={!!errors.heading || undefined}>
        <FieldLabel htmlFor="options-heading">
          Heading <span className="text-muted-foreground">(optional)</span>
        </FieldLabel>
        <Input id="options-heading" placeholder="Types of this treatment" {...register("heading")} />
        <FieldError errors={[errors.heading]} />
      </Field>

      <div className="flex flex-col gap-3">
        <FieldLabel>Options</FieldLabel>
        {fields.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">No options added yet.</p>
        ) : (
          fields.map((field, index) => (
            <div key={field.id} className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <span className="text-body-sm font-semibold text-foreground">Option {index + 1}</span>
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
                    aria-label={`Remove option ${index + 1}`}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <Field data-invalid={!!errors.items?.[index]?.title || undefined}>
                <FieldLabel htmlFor={`option-title-${index}`}>
                  Title <span className="text-destructive">*</span>
                </FieldLabel>
                <Input id={`option-title-${index}`} {...register(`items.${index}.title` as const)} />
                <FieldError errors={[errors.items?.[index]?.title]} />
              </Field>

              <Field data-invalid={!!errors.items?.[index]?.description || undefined}>
                <FieldLabel htmlFor={`option-description-${index}`}>
                  Description <span className="text-destructive">*</span>
                </FieldLabel>
                <Textarea id={`option-description-${index}`} rows={2} {...register(`items.${index}.description` as const)} />
                <FieldError errors={[errors.items?.[index]?.description]} />
              </Field>

              <Field>
                <FieldLabel htmlFor={`option-points-${index}`}>
                  Key Points <span className="text-muted-foreground">(optional, one per line)</span>
                </FieldLabel>
                <Controller
                  name={`items.${index}.pointsText` as const}
                  control={control}
                  render={({ field: pointsField }) => (
                    <Textarea id={`option-points-${index}`} rows={3} placeholder={"One point per line"} {...pointsField} />
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
          disabled={fields.length >= 6}
          onClick={() => append({ title: "", description: "", pointsText: "" })}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add Option
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
