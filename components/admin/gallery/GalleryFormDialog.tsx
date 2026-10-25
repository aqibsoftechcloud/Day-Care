"use client";

import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/admin/FormDialog";
import { FormFieldGrid } from "@/components/admin/FormFieldGrid";
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
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { ApiError } from "@/lib/api/client";
import { createGalleryItem, getGalleryItem, updateGalleryItem } from "@/lib/api/gallery";
import { notify } from "@/lib/toast";
import { galleryKeys } from "@/components/admin/gallery/queries";
import type { Gallery } from "@/types/gallery";

// Mirrors validators/gallery.validator.ts's createGallerySchema exactly.
// `source` is a plain string field (no upload/storage wiring exists for
// this table — confirmed by reading the validator's own comment).
const galleryFormSchema = z.object({
  gallery_name: z.string().trim().min(1, "Gallery name is required").max(255, "Name is too long"),
  gallery_type: z.enum(["image", "video"]),
  gallery_status: z.enum(["active", "inactive"]),
  source: z.string().trim().max(1000, "Source is too long").optional(),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255, "SEO URL is too long"),
  meta_title: z.string().trim().max(255, "Meta title is too long").optional(),
  meta_keyword: z.string().trim().max(500, "Meta keyword is too long").optional(),
  meta_description: z.string().trim().optional(),
});

type GalleryFormValues = z.infer<typeof galleryFormSchema>;

type GalleryFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  galleryId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function GalleryFormDialog({ open, mode, galleryId, onOpenChange }: GalleryFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add Gallery Item" : "Edit Gallery Item"}
      description={mode === "create" ? "Create a new gallery item." : "Update this gallery item's details."}
    >
      {open && (
        <GalleryFormBody
          key={mode === "edit" ? (galleryId ?? "edit") : "create"}
          mode={mode}
          galleryId={galleryId}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function GalleryFormBody({
  mode,
  galleryId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  galleryId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const galleryQuery = useQuery({
    queryKey: galleryKeys.detail(galleryId ?? -1),
    queryFn: () => getGalleryItem(galleryId as number),
    enabled: mode === "edit" && galleryId !== null,
  });

  if (mode === "edit" && galleryQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading gallery item…
      </div>
    );
  }

  if (mode === "edit" && galleryQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {galleryQuery.error instanceof ApiError ? galleryQuery.error.message : "Failed to load gallery item."}
      </p>
    );
  }

  return (
    <GalleryForm
      mode={mode}
      galleryId={galleryId}
      initialItem={galleryQuery.data?.galleryItem}
      onOpenChange={onOpenChange}
    />
  );
}

function GalleryForm({
  mode,
  galleryId,
  initialItem,
  onOpenChange,
}: {
  mode: "create" | "edit";
  galleryId: number | null;
  initialItem?: Gallery;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<GalleryFormValues>({
    resolver: zodResolver(galleryFormSchema),
    defaultValues: {
      gallery_name: initialItem?.gallery_name ?? "",
      gallery_type: initialItem?.gallery_type ?? "image",
      gallery_status: initialItem?.gallery_status === "inactive" ? "inactive" : "active",
      source: initialItem?.source ?? "",
      seo_url: initialItem?.seo_url ?? "",
      meta_title: initialItem?.meta_title ?? "",
      meta_keyword: initialItem?.meta_keyword ?? "",
      meta_description: initialItem?.meta_description ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: GalleryFormValues) => {
      const payload = {
        gallery_name: values.gallery_name,
        gallery_type: values.gallery_type,
        gallery_status: values.gallery_status,
        source: values.source ? values.source : null,
        seo_url: values.seo_url,
        meta_title: values.meta_title ? values.meta_title : null,
        meta_keyword: values.meta_keyword ? values.meta_keyword : null,
        meta_description: values.meta_description ? values.meta_description : null,
      };
      if (mode === "create") {
        return createGalleryItem(payload);
      }
      return updateGalleryItem(galleryId as number, payload);
    },
    onSuccess: () => {
      notify.success(mode === "create" ? "Gallery item created successfully." : "Gallery item updated successfully.");
      queryClient.invalidateQueries({ queryKey: galleryKeys.all });
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: GalleryFormValues) => {
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
          <Field className="sm:col-span-2" data-invalid={!!errors.gallery_name || undefined}>
            <FieldLabel htmlFor="gallery-name">
              Gallery Name <span className="text-destructive">*</span>
            </FieldLabel>
            <Input id="gallery-name" aria-invalid={!!errors.gallery_name || undefined} {...register("gallery_name")} />
            <FieldError errors={[errors.gallery_name]} />
          </Field>

          <Field data-invalid={!!errors.gallery_type || undefined}>
            <FieldLabel htmlFor="gallery-type">
              Type <span className="text-destructive">*</span>
            </FieldLabel>
            <Controller
              name="gallery_type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="gallery-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.gallery_type]} />
          </Field>

          <Field data-invalid={!!errors.gallery_status || undefined}>
            <FieldLabel htmlFor="gallery-status">Status</FieldLabel>
            <Controller
              name="gallery_status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="gallery-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.gallery_status]} />
          </Field>

          <Field className="sm:col-span-2" data-invalid={!!errors.source || undefined}>
            <FieldLabel htmlFor="gallery-source">
              Source <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="gallery-source" placeholder="https://…" {...register("source")} />
            <FieldError errors={[errors.source]} />
          </Field>
        </FormFieldGrid>
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
          SEO
        </FieldLegend>
        <FormFieldGrid>
          <Field className="sm:col-span-2" data-invalid={!!errors.seo_url || undefined}>
            <FieldLabel htmlFor="gallery-seo-url">
              SEO URL <span className="text-destructive">*</span>
            </FieldLabel>
            <Input id="gallery-seo-url" aria-invalid={!!errors.seo_url || undefined} {...register("seo_url")} />
            <FieldError errors={[errors.seo_url]} />
          </Field>

          <Field data-invalid={!!errors.meta_title || undefined}>
            <FieldLabel htmlFor="gallery-meta-title">
              Meta Title <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="gallery-meta-title" {...register("meta_title")} />
            <FieldError errors={[errors.meta_title]} />
          </Field>

          <Field data-invalid={!!errors.meta_keyword || undefined}>
            <FieldLabel htmlFor="gallery-meta-keyword">
              Meta Keyword <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="gallery-meta-keyword" {...register("meta_keyword")} />
            <FieldError errors={[errors.meta_keyword]} />
          </Field>

          <Field className="sm:col-span-2" data-invalid={!!errors.meta_description || undefined}>
            <FieldLabel htmlFor="gallery-meta-description">
              Meta Description <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Textarea id="gallery-meta-description" rows={3} {...register("meta_description")} />
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
          {mode === "create" ? "Create Gallery Item" : "Save Changes"}
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
