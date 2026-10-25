"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { FormDialog } from "@/components/admin/FormDialog";
import { LoadingButton } from "@/components/admin/LoadingButton";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { ApiError } from "@/lib/api/client";
import { listTreatmentSections, updateTreatmentSection } from "@/lib/api/treatment-sections";
import { notify } from "@/lib/toast";
import { treatmentSectionsKey } from "@/components/admin/treatments/TreatmentSectionsPanel";
import type { FactsSectionContent, HighlightsSectionContent, TreatmentSectionType } from "@/types/treatment-section";

const itemSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(100),
  value: z.string().trim().min(1, "Value is required").max(255),
});
const formSchema = z.object({ items: z.array(itemSchema) });
type FormValues = z.infer<typeof formSchema>;

type TreatmentLabelValueSectionDialogProps = {
  open: boolean;
  treatmentId: number | null;
  treatmentName?: string;
  onOpenChange: (open: boolean) => void;
  /** Which fixed section row this dialog edits — "highlights" (the compact strip under the Hero) or "facts" (the "At a Glance" table). Same content shape for both, different position/rendering on the public page. */
  sectionType: Extract<TreatmentSectionType, "highlights" | "facts">;
  dialogTitle: string;
  itemNounSingular: string;
  maxItems: number;
};

/**
 * Shared editor for the two plain label/value fixed sections (Highlights
 * strip, Treatment Facts table) — same content shape
 * (`{items: [{label, value}]}`), just a different `section_type`/
 * position/max length. One component instead of two near-duplicates.
 */
export function TreatmentLabelValueSectionDialog({
  open,
  treatmentId,
  treatmentName,
  onOpenChange,
  sectionType,
  dialogTitle,
  itemNounSingular,
  maxItems,
}: TreatmentLabelValueSectionDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={dialogTitle}
      description={treatmentName ? `Treatment: ${treatmentName}` : undefined}
      className="sm:max-w-xl"
    >
      {open && treatmentId !== null && (
        <TreatmentLabelValueSectionBody
          treatmentId={treatmentId}
          onOpenChange={onOpenChange}
          sectionType={sectionType}
          itemNounSingular={itemNounSingular}
          maxItems={maxItems}
        />
      )}
    </FormDialog>
  );
}

function TreatmentLabelValueSectionBody({
  treatmentId,
  onOpenChange,
  sectionType,
  itemNounSingular,
  maxItems,
}: {
  treatmentId: number;
  onOpenChange: (open: boolean) => void;
  sectionType: "highlights" | "facts";
  itemNounSingular: string;
  maxItems: number;
}) {
  const sectionsQuery = useQuery({
    queryKey: treatmentSectionsKey(treatmentId),
    queryFn: () => listTreatmentSections(treatmentId),
  });

  const section = sectionsQuery.data?.sections.find((s) => s.section_type === sectionType);

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
    <TreatmentLabelValueSectionForm
      key={section.id}
      treatmentId={treatmentId}
      sectionId={section.id}
      initialContent={section.content as HighlightsSectionContent | FactsSectionContent | null}
      onOpenChange={onOpenChange}
      itemNounSingular={itemNounSingular}
      maxItems={maxItems}
    />
  );
}

function TreatmentLabelValueSectionForm({
  treatmentId,
  sectionId,
  initialContent,
  onOpenChange,
  itemNounSingular,
  maxItems,
}: {
  treatmentId: number;
  sectionId: number;
  initialContent: HighlightsSectionContent | FactsSectionContent | null;
  onOpenChange: (open: boolean) => void;
  itemNounSingular: string;
  maxItems: number;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { items: initialContent?.items ?? [] },
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: "items" });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => updateTreatmentSection(treatmentId, sectionId, { content: values }),
    onSuccess: () => {
      notify.success("Content saved.");
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

      <p className="text-helper text-muted-foreground">Leave empty to hide this section on the public page.</p>

      <div className="flex flex-col gap-3">
        {fields.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">No {itemNounSingular.toLowerCase()}s added yet.</p>
        ) : (
          fields.map((field, index) => (
            <div key={field.id} className="flex items-end gap-2 rounded-lg border border-border bg-muted/20 p-3">
              <Field className="flex-1" data-invalid={!!errors.items?.[index]?.label || undefined}>
                <FieldLabel htmlFor={`item-label-${index}`}>Label</FieldLabel>
                <Input id={`item-label-${index}`} placeholder="Procedure Time" {...register(`items.${index}.label` as const)} />
                <FieldError errors={[errors.items?.[index]?.label]} />
              </Field>
              <Field className="flex-1" data-invalid={!!errors.items?.[index]?.value || undefined}>
                <FieldLabel htmlFor={`item-value-${index}`}>Value</FieldLabel>
                <Input id={`item-value-${index}`} placeholder="30–45 min" {...register(`items.${index}.value` as const)} />
                <FieldError errors={[errors.items?.[index]?.value]} />
              </Field>
              <div className="flex items-center gap-0.5 pb-0.5">
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
                  aria-label={`Remove ${itemNounSingular.toLowerCase()} ${index + 1}`}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          disabled={fields.length >= maxItems}
          onClick={() => append({ label: "", value: "" })}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add {itemNounSingular}
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
