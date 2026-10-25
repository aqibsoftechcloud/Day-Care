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
import { listHospitalSections, updateHospitalSection } from "@/lib/api/hospital-sections";
import { whyChooseUsSectionContentSchema } from "@/validators/hospital-section.validator";
import { notify } from "@/lib/toast";
import type { WhyChooseUsIconKey, WhyChooseUsSectionContent } from "@/types/hospital-section";

export const hospitalSectionsKey = (hospitalId: number) => ["hospital-sections", hospitalId] as const;

type HospitalWhyChooseUsDialogProps = {
  open: boolean;
  hospitalId: number | null;
  hospitalName?: string;
  onOpenChange: (open: boolean) => void;
};

/** Same controlled icon allowlist as Speciality/Treatment's Why Choose Us — own local copy per this codebase's established convention. */
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

type FormValues = WhyChooseUsSectionContent;

/** Edits the ONE `why_choose_us` section row's content — mirrors `TreatmentWhyChooseUsDialog.tsx` exactly, own independent `hospital_sections` data source. */
export function HospitalWhyChooseUsDialog({ open, hospitalId, hospitalName, onOpenChange }: HospitalWhyChooseUsDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Manage Why Choose Us"
      description={hospitalName ? `Hospital: ${hospitalName}` : undefined}
      className="sm:max-w-2xl"
    >
      {open && hospitalId !== null && <HospitalWhyChooseUsBody hospitalId={hospitalId} onOpenChange={onOpenChange} />}
    </FormDialog>
  );
}

function HospitalWhyChooseUsBody({ hospitalId, onOpenChange }: { hospitalId: number; onOpenChange: (open: boolean) => void }) {
  const sectionsQuery = useQuery({
    queryKey: hospitalSectionsKey(hospitalId),
    queryFn: () => listHospitalSections(hospitalId),
  });

  const section = sectionsQuery.data?.sections.find((s) => s.section_type === "why_choose_us");

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
        {sectionsQuery.error instanceof ApiError ? sectionsQuery.error.message : "Failed to load Why Choose Us content."}
      </p>
    );
  }

  return (
    <HospitalWhyChooseUsForm
      key={section.id}
      hospitalId={hospitalId}
      sectionId={section.id}
      initialContent={section.content as WhyChooseUsSectionContent | null}
      onOpenChange={onOpenChange}
    />
  );
}

function HospitalWhyChooseUsForm({
  hospitalId,
  sectionId,
  initialContent,
  onOpenChange,
}: {
  hospitalId: number;
  sectionId: number;
  initialContent: WhyChooseUsSectionContent | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(whyChooseUsSectionContentSchema),
    defaultValues: {
      heading: initialContent?.heading ?? "",
      items: initialContent?.items ?? [],
    },
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: "items" });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => updateHospitalSection(hospitalId, sectionId, { content: values }),
    onSuccess: () => {
      notify.success("Why Choose Us content saved.");
      queryClient.invalidateQueries({ queryKey: hospitalSectionsKey(hospitalId) });
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
        <FieldLabel htmlFor="hwcu-heading">
          Heading <span className="text-muted-foreground">(optional)</span>
        </FieldLabel>
        <Input id="hwcu-heading" placeholder="Choosing care at this hospital" {...register("heading")} />
        <FieldError errors={[errors.heading]} />
      </Field>

      <div className="flex flex-col gap-3">
        <FieldLabel>Reasons</FieldLabel>
        {fields.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">No reasons added yet.</p>
        ) : (
          fields.map((field, index) => (
            <div key={field.id} className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <span className="text-body-sm font-semibold text-foreground">Reason {index + 1}</span>
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
                    aria-label={`Remove reason ${index + 1}`}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <Field data-invalid={!!errors.items?.[index]?.icon_key || undefined}>
                <FieldLabel htmlFor={`hwcu-icon-${index}`}>Icon</FieldLabel>
                <Controller
                  name={`items.${index}.icon_key` as const}
                  control={control}
                  render={({ field: iconField }) => (
                    <Select value={iconField.value} onValueChange={iconField.onChange}>
                      <SelectTrigger id={`hwcu-icon-${index}`} className="w-full sm:w-56">
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
                <FieldLabel htmlFor={`hwcu-title-${index}`}>
                  Title <span className="text-destructive">*</span>
                </FieldLabel>
                <Input id={`hwcu-title-${index}`} {...register(`items.${index}.title` as const)} />
                <FieldError errors={[errors.items?.[index]?.title]} />
              </Field>

              <Field data-invalid={!!errors.items?.[index]?.description || undefined}>
                <FieldLabel htmlFor={`hwcu-description-${index}`}>
                  Description <span className="text-destructive">*</span>
                </FieldLabel>
                <Textarea id={`hwcu-description-${index}`} rows={2} {...register(`items.${index}.description` as const)} />
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
          Add Reason
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
