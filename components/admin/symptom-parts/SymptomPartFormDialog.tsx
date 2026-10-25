"use client";

import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/admin/FormDialog";
import { FormFieldGrid } from "@/components/admin/FormFieldGrid";
import { LoadingButton } from "@/components/admin/LoadingButton";
import { RichTextEditor } from "@/components/admin/editor/RichTextEditor";
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
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { ApiError } from "@/lib/api/client";
import { createSymptomPart, getSymptomPart, updateSymptomPart } from "@/lib/api/symptom-parts";
import { notify } from "@/lib/toast";
import { symptomPartsKeys } from "@/components/admin/symptom-parts/queries";
import type { SymptomPart } from "@/types/symptom-part";

// Mirrors validators/symptom-part.validator.ts's createSymptomPartSchema exactly.
const symptomPartFormSchema = z.object({
  part_name: z.string().trim().min(1, "Part name is required").max(255, "Name is too long"),
  status: z.enum(["active", "inactive"]),
  part_description: z.string().optional(),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255, "SEO URL is too long"),
  meta_title: z.string().trim().max(255, "Meta title is too long").optional(),
  meta_keywords: z.string().trim().max(500, "Meta keywords is too long").optional(),
  meta_description: z.string().trim().optional(),
});

type SymptomPartFormValues = z.infer<typeof symptomPartFormSchema>;

type SymptomPartFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  partId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function SymptomPartFormDialog({ open, mode, partId, onOpenChange }: SymptomPartFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add Part" : "Edit Part"}
      description={mode === "create" ? "Create a new body part." : "Update this part's details."}
      className="sm:max-w-3xl"
    >
      {open && (
        <SymptomPartFormBody
          key={mode === "edit" ? (partId ?? "edit") : "create"}
          mode={mode}
          partId={partId}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function SymptomPartFormBody({
  mode,
  partId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  partId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const partQuery = useQuery({
    queryKey: symptomPartsKeys.detail(partId ?? -1),
    queryFn: () => getSymptomPart(partId as number),
    enabled: mode === "edit" && partId !== null,
  });

  if (mode === "edit" && partQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading part…
      </div>
    );
  }

  if (mode === "edit" && partQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {partQuery.error instanceof ApiError ? partQuery.error.message : "Failed to load part."}
      </p>
    );
  }

  return (
    <SymptomPartForm mode={mode} partId={partId} initialPart={partQuery.data?.symptomPart} onOpenChange={onOpenChange} />
  );
}

function SymptomPartForm({
  mode,
  partId,
  initialPart,
  onOpenChange,
}: {
  mode: "create" | "edit";
  partId: number | null;
  initialPart?: SymptomPart;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SymptomPartFormValues>({
    resolver: zodResolver(symptomPartFormSchema),
    defaultValues: {
      part_name: initialPart?.part_name ?? "",
      status: initialPart?.status === "inactive" ? "inactive" : "active",
      part_description: initialPart?.part_description ?? "",
      seo_url: initialPart?.seo_url ?? "",
      meta_title: initialPart?.meta_title ?? "",
      meta_keywords: initialPart?.meta_keywords ?? "",
      meta_description: initialPart?.meta_description ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: SymptomPartFormValues) => {
      const payload = {
        part_name: values.part_name,
        status: values.status,
        part_description: values.part_description ? values.part_description : null,
        seo_url: values.seo_url,
        meta_title: values.meta_title ? values.meta_title : null,
        meta_keywords: values.meta_keywords ? values.meta_keywords : null,
        meta_description: values.meta_description ? values.meta_description : null,
      };
      if (mode === "create") {
        return createSymptomPart(payload);
      }
      return updateSymptomPart(partId as number, payload);
    },
    onSuccess: () => {
      notify.success(mode === "create" ? "Part created successfully." : "Part updated successfully.");
      queryClient.invalidateQueries({ queryKey: symptomPartsKeys.all });
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: SymptomPartFormValues) => {
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
          <Field className="sm:col-span-2" data-invalid={!!errors.part_name || undefined}>
            <FieldLabel htmlFor="symptom-part-name">
              Part Name <span className="text-destructive">*</span>
            </FieldLabel>
            <Input id="symptom-part-name" aria-invalid={!!errors.part_name || undefined} {...register("part_name")} />
            <FieldError errors={[errors.part_name]} />
          </Field>

          <Field data-invalid={!!errors.status || undefined}>
            <FieldLabel htmlFor="symptom-part-status">Status</FieldLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="symptom-part-status" className="w-full">
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
        </FormFieldGrid>
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
          Content
        </FieldLegend>
        <FormFieldGrid>
          <Field className="sm:col-span-2" data-invalid={!!errors.part_description || undefined}>
            <FieldLabel htmlFor="symptom-part-description">
              Description <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Controller
              name="part_description"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  id="symptom-part-description"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Start writing the content for this part..."
                  error={!!errors.part_description}
                />
              )}
            />
            <FieldError errors={[errors.part_description]} />
          </Field>
        </FormFieldGrid>
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
          SEO
        </FieldLegend>
        <FormFieldGrid>
          <Field className="sm:col-span-2" data-invalid={!!errors.seo_url || undefined}>
            <FieldLabel htmlFor="symptom-part-seo-url">
              SEO URL <span className="text-destructive">*</span>
            </FieldLabel>
            <Input id="symptom-part-seo-url" aria-invalid={!!errors.seo_url || undefined} {...register("seo_url")} />
            <FieldError errors={[errors.seo_url]} />
          </Field>

          <Field data-invalid={!!errors.meta_title || undefined}>
            <FieldLabel htmlFor="symptom-part-meta-title">
              Meta Title <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="symptom-part-meta-title" {...register("meta_title")} />
            <FieldError errors={[errors.meta_title]} />
          </Field>

          <Field data-invalid={!!errors.meta_keywords || undefined}>
            <FieldLabel htmlFor="symptom-part-meta-keywords">
              Meta Keywords <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="symptom-part-meta-keywords" {...register("meta_keywords")} />
            <FieldError errors={[errors.meta_keywords]} />
          </Field>

          <Field className="sm:col-span-2" data-invalid={!!errors.meta_description || undefined}>
            <FieldLabel htmlFor="symptom-part-meta-description">
              Meta Description <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Textarea id="symptom-part-meta-description" rows={3} {...register("meta_description")} />
            <FieldError errors={[errors.meta_description]} />
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
          {mode === "create" ? "Create Part" : "Save Changes"}
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
