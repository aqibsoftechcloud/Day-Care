"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/admin/FormDialog";
import { FormFieldGrid } from "@/components/admin/FormFieldGrid";
import { FileUploadArea } from "@/components/admin/FileUploadArea";
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
import { createHealthPackage, getHealthPackage, updateHealthPackage } from "@/lib/api/health-packages";
import { notify } from "@/lib/toast";
import { healthPackagesKeys } from "@/components/admin/health-packages/queries";
import type { HealthPackage } from "@/types/health-package";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const IMAGE_HINT = "JPG, PNG, WEBP or GIF, up to 5MB";
const decimalPattern = /^-?\d+(\.\d+)?$/;

// Mirrors validators/health-package.validator.ts's createHealthPackageSchema
// exactly — pack_image is handled separately as File state below (multipart,
// not part of this JSON-shaped schema). package_file is a plain string
// reference, per the validator's own documented reasoning (not an upload).
const healthPackageFormSchema = z.object({
  package_title: z.string().trim().min(1, "Package title is required").max(255, "Title is too long"),
  cost: z.string().trim().refine((v) => v === "" || decimalPattern.test(v), "Enter a valid number").optional(),
  status: z.enum(["active", "inactive"]),
  package_file: z.string().trim().max(500, "URL is too long").optional(),
  package_inclusions: z.string().optional(),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255, "SEO URL is too long"),
  meta_title: z.string().trim().max(255, "Meta title is too long").optional(),
  meta_keywords: z.string().trim().max(500, "Meta keywords is too long").optional(),
  meta_description: z.string().trim().optional(),
});

type HealthPackageFormValues = z.infer<typeof healthPackageFormSchema>;

type HealthPackageFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  healthPackageId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function HealthPackageFormDialog({ open, mode, healthPackageId, onOpenChange }: HealthPackageFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add Package" : "Edit Package"}
      description={mode === "create" ? "Create a new health package." : "Update this health package's details."}
      className="sm:max-w-4xl"
    >
      {open && (
        <HealthPackageFormBody
          key={mode === "edit" ? (healthPackageId ?? "edit") : "create"}
          mode={mode}
          healthPackageId={healthPackageId}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function HealthPackageFormBody({
  mode,
  healthPackageId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  healthPackageId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const healthPackageQuery = useQuery({
    queryKey: healthPackagesKeys.detail(healthPackageId ?? -1),
    queryFn: () => getHealthPackage(healthPackageId as number),
    enabled: mode === "edit" && healthPackageId !== null,
  });

  if (mode === "edit" && healthPackageQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading package…
      </div>
    );
  }

  if (mode === "edit" && healthPackageQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {healthPackageQuery.error instanceof ApiError ? healthPackageQuery.error.message : "Failed to load package."}
      </p>
    );
  }

  return (
    <HealthPackageForm
      mode={mode}
      healthPackageId={healthPackageId}
      initialHealthPackage={healthPackageQuery.data?.healthPackage}
      onOpenChange={onOpenChange}
    />
  );
}

function HealthPackageForm({
  mode,
  healthPackageId,
  initialHealthPackage,
  onOpenChange,
}: {
  mode: "create" | "edit";
  healthPackageId: number | null;
  initialHealthPackage?: HealthPackage;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<HealthPackageFormValues>({
    resolver: zodResolver(healthPackageFormSchema),
    defaultValues: {
      package_title: initialHealthPackage?.package_title ?? "",
      cost: initialHealthPackage?.cost ?? "0",
      status: initialHealthPackage?.status === "inactive" ? "inactive" : "active",
      package_file: initialHealthPackage?.package_file ?? "",
      package_inclusions: initialHealthPackage?.package_inclusions ?? "",
      seo_url: initialHealthPackage?.seo_url ?? "",
      meta_title: initialHealthPackage?.meta_title ?? "",
      meta_keywords: initialHealthPackage?.meta_keywords ?? "",
      meta_description: initialHealthPackage?.meta_description ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: HealthPackageFormValues) => {
      const payload = {
        package_title: values.package_title,
        cost: values.cost ? values.cost : "0",
        status: values.status,
        package_file: values.package_file ? values.package_file : null,
        package_inclusions: values.package_inclusions ? values.package_inclusions : null,
        seo_url: values.seo_url,
        meta_title: values.meta_title ? values.meta_title : null,
        meta_keywords: values.meta_keywords ? values.meta_keywords : null,
        meta_description: values.meta_description ? values.meta_description : null,
      };
      if (mode === "create") {
        return createHealthPackage(payload, imageFiles[0]);
      }
      return updateHealthPackage(healthPackageId as number, payload, imageFiles[0]);
    },
    onSuccess: () => {
      notify.success(mode === "create" ? "Package created successfully." : "Package updated successfully.");
      queryClient.invalidateQueries({ queryKey: healthPackagesKeys.all });
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: HealthPackageFormValues) => {
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
        <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
          Package Information
        </FieldLegend>
        <FormFieldGrid>
          <Field className="sm:col-span-2" data-invalid={!!errors.package_title || undefined}>
            <FieldLabel htmlFor="health-package-title">
              Package Title <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="health-package-title"
              aria-invalid={!!errors.package_title || undefined}
              {...register("package_title")}
            />
            <FieldError errors={[errors.package_title]} />
          </Field>

          <Field data-invalid={!!errors.cost || undefined}>
            <FieldLabel htmlFor="health-package-cost">
              Cost <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="health-package-cost" type="number" step="0.01" {...register("cost")} />
            <FieldError errors={[errors.cost]} />
          </Field>

          <Field data-invalid={!!errors.status || undefined}>
            <FieldLabel htmlFor="health-package-status">Status</FieldLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="health-package-status" className="w-full">
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

          <Field className="sm:col-span-2" data-invalid={!!errors.package_file || undefined}>
            <FieldLabel htmlFor="health-package-file">
              Package File <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="health-package-file" placeholder="e.g. /uploads/brochure.pdf" {...register("package_file")} />
            <FieldError errors={[errors.package_file]} />
          </Field>

          <Field className="sm:col-span-2">
            <FieldLabel>
              Pack Image <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            {mode === "edit" && initialHealthPackage?.pack_image && imageFiles.length === 0 && (
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- small preview of the currently stored image. */}
                <img
                  src={initialHealthPackage.pack_image}
                  alt=""
                  className="size-10 rounded-md border border-border object-contain"
                />
                <span className="text-body-sm text-muted-foreground">Current image — upload a new file to replace it.</span>
              </div>
            )}
            <FileUploadArea
              files={imageFiles}
              onFilesChange={setImageFiles}
              accept={IMAGE_ACCEPT}
              hint={IMAGE_HINT}
              disabled={mutation.isPending}
            />
          </Field>
        </FormFieldGrid>
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
          Content
        </FieldLegend>
        <FormFieldGrid>
          <Field className="sm:col-span-2" data-invalid={!!errors.package_inclusions || undefined}>
            <FieldLabel htmlFor="health-package-inclusions">
              Package Inclusions <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Controller
              name="package_inclusions"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  id="health-package-inclusions"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="List what this package includes..."
                  error={!!errors.package_inclusions}
                />
              )}
            />
            <FieldError errors={[errors.package_inclusions]} />
          </Field>
        </FormFieldGrid>
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
          SEO
        </FieldLegend>
        <FormFieldGrid>
          <Field className="sm:col-span-2" data-invalid={!!errors.seo_url || undefined}>
            <FieldLabel htmlFor="health-package-seo-url">
              SEO URL <span className="text-destructive">*</span>
            </FieldLabel>
            <Input id="health-package-seo-url" aria-invalid={!!errors.seo_url || undefined} {...register("seo_url")} />
            <FieldError errors={[errors.seo_url]} />
          </Field>

          <Field data-invalid={!!errors.meta_title || undefined}>
            <FieldLabel htmlFor="health-package-meta-title">
              Meta Title <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="health-package-meta-title" {...register("meta_title")} />
            <FieldError errors={[errors.meta_title]} />
          </Field>

          <Field data-invalid={!!errors.meta_keywords || undefined}>
            <FieldLabel htmlFor="health-package-meta-keywords">
              Meta Keywords <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="health-package-meta-keywords" {...register("meta_keywords")} />
            <FieldError errors={[errors.meta_keywords]} />
          </Field>

          <Field className="sm:col-span-2" data-invalid={!!errors.meta_description || undefined}>
            <FieldLabel htmlFor="health-package-meta-description">
              Meta Description <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Textarea id="health-package-meta-description" rows={3} {...register("meta_description")} />
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
          {mode === "create" ? "Create Package" : "Save Changes"}
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
