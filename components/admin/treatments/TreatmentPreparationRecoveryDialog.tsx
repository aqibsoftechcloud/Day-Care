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
import type { PreparationRecoverySectionContent } from "@/types/treatment-section";

const groupSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100),
  intro: z.string().trim().max(500).optional(),
  itemsText: z.string().trim().optional(),
});
const formSchema = z.object({ groups: z.array(groupSchema).max(6) });
type FormValues = z.infer<typeof formSchema>;

type TreatmentPreparationRecoveryDialogProps = {
  open: boolean;
  treatmentId: number | null;
  treatmentName?: string;
  onOpenChange: (open: boolean) => void;
};

/** Edits the ONE `preparation_recovery` section row's content ("Preparation, Recovery & Aftercare" — the 3-column editorial block). Each group's bullet points are entered one per line. */
export function TreatmentPreparationRecoveryDialog({
  open,
  treatmentId,
  treatmentName,
  onOpenChange,
}: TreatmentPreparationRecoveryDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Manage Preparation / Recovery / Aftercare"
      description={treatmentName ? `Treatment: ${treatmentName}` : undefined}
      className="sm:max-w-2xl"
    >
      {open && treatmentId !== null && <TreatmentPreparationRecoveryBody treatmentId={treatmentId} onOpenChange={onOpenChange} />}
    </FormDialog>
  );
}

function TreatmentPreparationRecoveryBody({ treatmentId, onOpenChange }: { treatmentId: number; onOpenChange: (open: boolean) => void }) {
  const sectionsQuery = useQuery({ queryKey: treatmentSectionsKey(treatmentId), queryFn: () => listTreatmentSections(treatmentId) });
  const section = sectionsQuery.data?.sections.find((s) => s.section_type === "preparation_recovery");

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
    <TreatmentPreparationRecoveryForm
      key={section.id}
      treatmentId={treatmentId}
      sectionId={section.id}
      initialContent={section.content as PreparationRecoverySectionContent | null}
      onOpenChange={onOpenChange}
    />
  );
}

function TreatmentPreparationRecoveryForm({
  treatmentId,
  sectionId,
  initialContent,
  onOpenChange,
}: {
  treatmentId: number;
  sectionId: number;
  initialContent: PreparationRecoverySectionContent | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      groups: (initialContent?.groups ?? []).map((group) => ({
        title: group.title,
        intro: group.intro ?? "",
        itemsText: (group.items ?? []).join("\n"),
      })),
    },
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: "groups" });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      updateTreatmentSection(treatmentId, sectionId, {
        content: {
          groups: values.groups.map((group) => ({
            title: group.title,
            intro: group.intro || null,
            items: (group.itemsText ?? "")
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean),
          })),
        },
      }),
    onSuccess: () => {
      notify.success("Preparation/Recovery content saved.");
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

      <p className="text-helper text-muted-foreground">Typically 3 groups: Preparation, Recovery, Aftercare.</p>

      <div className="flex flex-col gap-3">
        {fields.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">No groups added yet.</p>
        ) : (
          fields.map((field, index) => (
            <div key={field.id} className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <span className="text-body-sm font-semibold text-foreground">Group {index + 1}</span>
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
                    aria-label={`Remove group ${index + 1}`}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <Field data-invalid={!!errors.groups?.[index]?.title || undefined}>
                <FieldLabel htmlFor={`prep-title-${index}`}>
                  Title <span className="text-destructive">*</span>
                </FieldLabel>
                <Input id={`prep-title-${index}`} placeholder="Preparation" {...register(`groups.${index}.title` as const)} />
                <FieldError errors={[errors.groups?.[index]?.title]} />
              </Field>

              <Field data-invalid={!!errors.groups?.[index]?.intro || undefined}>
                <FieldLabel htmlFor={`prep-intro-${index}`}>
                  Intro Line <span className="text-muted-foreground">(optional)</span>
                </FieldLabel>
                <Input id={`prep-intro-${index}`} {...register(`groups.${index}.intro` as const)} />
                <FieldError errors={[errors.groups?.[index]?.intro]} />
              </Field>

              <Field>
                <FieldLabel htmlFor={`prep-items-${index}`}>
                  Bullet Points <span className="text-muted-foreground">(one per line)</span>
                </FieldLabel>
                <Controller
                  name={`groups.${index}.itemsText` as const}
                  control={control}
                  render={({ field: itemsField }) => (
                    <Textarea id={`prep-items-${index}`} rows={3} placeholder={"One point per line"} {...itemsField} />
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
          onClick={() => append({ title: "", intro: "", itemsText: "" })}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add Group
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
