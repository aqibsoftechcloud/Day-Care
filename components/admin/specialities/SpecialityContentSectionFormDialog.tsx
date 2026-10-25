"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/admin/FormDialog";
import { LoadingButton } from "@/components/admin/LoadingButton";
import { RichTextEditor } from "@/components/admin/editor/RichTextEditor";
import { SectionImageField, type SectionImageValue } from "@/components/admin/pages/SectionImageField";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { ApiError } from "@/lib/api/client";
import {
  createSpecialitySection,
  updateSpecialitySection,
  uploadSpecialitySectionImage,
} from "@/lib/api/speciality-sections";
import { customSectionContentSchema } from "@/validators/speciality-section.validator";
import { notify } from "@/lib/toast";
import { specialitySectionsKey } from "@/components/admin/specialities/SpecialitySectionsPanel";
import type { CustomSectionContent, SpecialitySection, SpecialitySectionStatus } from "@/types/speciality-section";

type FormValues = CustomSectionContent;

type SpecialityContentSectionFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  /** The full section being edited — `null` in create mode. Passed directly from the parent's already-loaded list rather than re-fetched by id. */
  section: SpecialitySection | null;
  specialityId: number;
  onOpenChange: (open: boolean) => void;
};

/**
 * Add/Edit form for one custom content section — Title, rich-text
 * Content (existing RichTextEditor), optional Image (existing
 * SectionImageField, reused verbatim from the Pages module rather than
 * duplicated — it's already fully generic), and Status. Mirrors
 * PageSectionFieldsForm's `AboutFields` upload-then-save flow exactly:
 * a picked image is uploaded first (getting back a stored path), then
 * that path is included in the JSON content saved to the section row.
 */
export function SpecialityContentSectionFormDialog({
  open,
  mode,
  section,
  specialityId,
  onOpenChange,
}: SpecialityContentSectionFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add Content Section" : "Edit Content Section"}
      description={
        mode === "create" ? "Create a new custom content section for this speciality." : "Update this content section."
      }
    >
      {open && (
        <SpecialityContentSectionForm
          key={mode === "edit" ? (section?.id ?? "edit") : "create"}
          mode={mode}
          section={section}
          specialityId={specialityId}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function SpecialityContentSectionForm({
  mode,
  section,
  specialityId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  section: SpecialitySection | null;
  specialityId: number;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const initialContent = (section?.content as CustomSectionContent | null) ?? null;

  const [image, setImage] = useState<SectionImageValue>({ path: initialContent?.image ?? null });
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<SpecialitySectionStatus>(section?.status ?? "active");

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(customSectionContentSchema),
    defaultValues: {
      title: initialContent?.title ?? "",
      content: initialContent?.content ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      let imagePath = image.path;
      if (image.pendingFile) {
        setUploading(true);
        try {
          imagePath = (await uploadSpecialitySectionImage(image.pendingFile)).path;
        } finally {
          setUploading(false);
        }
      }

      const content = { title: values.title, content: values.content, image: imagePath };

      if (mode === "create") {
        return createSpecialitySection(specialityId, { content, status });
      }
      return updateSpecialitySection(specialityId, section!.id, { content, status });
    },
    onSuccess: () => {
      notify.success(mode === "create" ? "Content section created." : "Content section updated.");
      queryClient.invalidateQueries({ queryKey: specialitySectionsKey(specialityId) });
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  const busy = isSubmitting || uploading || mutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {mutation.isError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {mutation.error instanceof ApiError ? mutation.error.message : "Something went wrong."}
        </div>
      )}

      <Field data-invalid={!!errors.title || undefined}>
        <FieldLabel htmlFor="content-section-title">
          Section Title <span className="text-destructive">*</span>
        </FieldLabel>
        <Input id="content-section-title" aria-invalid={!!errors.title || undefined} {...register("title")} />
        <FieldError errors={[errors.title]} />
      </Field>

      <Field data-invalid={!!errors.content || undefined}>
        <FieldLabel htmlFor="content-section-content">
          Rich Text Content <span className="text-destructive">*</span>
        </FieldLabel>
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <RichTextEditor
              id="content-section-content"
              value={field.value ?? ""}
              onChange={field.onChange}
              placeholder="Write this section's content…"
              error={!!errors.content}
            />
          )}
        />
        <FieldError errors={[errors.content]} />
      </Field>

      <SectionImageField label="Image" value={image} onChange={setImage} disabled={busy} />

      <Field>
        <FieldLabel htmlFor="content-section-status">Status</FieldLabel>
        <Select value={status} onValueChange={(value) => setStatus(value as SpecialitySectionStatus)} disabled={busy}>
          <SelectTrigger id="content-section-status" className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
          Cancel
        </Button>
        <LoadingButton type="submit" disabled={isSubmitting} loading={mutation.isPending || uploading}>
          {mode === "create" ? "Create Section" : "Save Changes"}
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
