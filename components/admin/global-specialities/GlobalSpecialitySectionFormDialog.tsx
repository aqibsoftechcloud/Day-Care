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
  createGlobalSpecialitySection,
  updateGlobalSpecialitySection,
  uploadGlobalSpecialitySectionImage,
} from "@/lib/api/global-speciality-sections";
import { createGlobalSpecialitySectionSchema } from "@/validators/global-speciality-section.validator";
import { notify } from "@/lib/toast";
import { globalSpecialitySectionsKeys } from "@/components/admin/global-specialities/queries";
import type { GlobalSpecialitySection, GlobalSpecialitySectionStatus } from "@/types/global-speciality-section";
import { z } from "zod";

const formSchema = createGlobalSpecialitySectionSchema.pick({ title: true }).extend({
  content: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

type GlobalSpecialitySectionFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  section: GlobalSpecialitySection | null;
  globalSpecialityId: number;
  onOpenChange: (open: boolean) => void;
};

/** Add/Edit form for one content section — mirrors `GlobalTreatmentSectionFormDialog.tsx` exactly, own independent `global_speciality_sections` data source. */
export function GlobalSpecialitySectionFormDialog({
  open,
  mode,
  section,
  globalSpecialityId,
  onOpenChange,
}: GlobalSpecialitySectionFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add Content Section" : "Edit Content Section"}
      description={mode === "create" ? "Create a new content section for this global speciality." : "Update this content section."}
    >
      {open && (
        <GlobalSpecialitySectionForm
          key={mode === "edit" ? (section?.id ?? "edit") : "create"}
          mode={mode}
          section={section}
          globalSpecialityId={globalSpecialityId}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function GlobalSpecialitySectionForm({
  mode,
  section,
  globalSpecialityId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  section: GlobalSpecialitySection | null;
  globalSpecialityId: number;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const [image, setImage] = useState<SectionImageValue>({ path: section?.image ?? null });
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<GlobalSpecialitySectionStatus>(section?.status ?? "active");

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: section?.title ?? "",
      content: section?.content ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      let imagePath = image.path;
      if (image.pendingFile) {
        setUploading(true);
        try {
          imagePath = (await uploadGlobalSpecialitySectionImage(image.pendingFile)).path;
        } finally {
          setUploading(false);
        }
      }

      const payload = { title: values.title, content: values.content ?? "", image: imagePath, status };

      if (mode === "create") {
        return createGlobalSpecialitySection(globalSpecialityId, payload);
      }
      return updateGlobalSpecialitySection(globalSpecialityId, section!.id, payload);
    },
    onSuccess: () => {
      notify.success(mode === "create" ? "Content section created." : "Content section updated.");
      queryClient.invalidateQueries({ queryKey: globalSpecialitySectionsKeys.byGlobalSpeciality(globalSpecialityId) });
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
        <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {mutation.error instanceof ApiError ? mutation.error.message : "Something went wrong."}
        </div>
      )}

      <Field data-invalid={!!errors.title || undefined}>
        <FieldLabel htmlFor="global-speciality-section-title">
          Section Title <span className="text-destructive">*</span>
        </FieldLabel>
        <Input id="global-speciality-section-title" aria-invalid={!!errors.title || undefined} {...register("title")} />
        <FieldError errors={[errors.title]} />
      </Field>

      <Field data-invalid={!!errors.content || undefined}>
        <FieldLabel htmlFor="global-speciality-section-content">Rich Text Content</FieldLabel>
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <RichTextEditor
              id="global-speciality-section-content"
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
        <FieldLabel htmlFor="global-speciality-section-status">Status</FieldLabel>
        <Select value={status} onValueChange={(value) => setStatus(value as GlobalSpecialitySectionStatus)} disabled={busy}>
          <SelectTrigger id="global-speciality-section-status" className="w-full sm:w-48">
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
