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
import { Field, FieldError, FieldLabel, FieldSet } from "@/components/ui/field";
import { ApiError } from "@/lib/api/client";
import { createNewsMediaItem, getNewsMediaItem, updateNewsMediaItem } from "@/lib/api/news-media";
import { notify } from "@/lib/toast";
import { newsMediaKeys } from "@/components/admin/news-media/queries";
import type { NewsMedia } from "@/types/news-media";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const IMAGE_HINT = "JPG, PNG, WEBP or GIF, up to 5MB";

// Mirrors validators/news-media.validator.ts's createNewsMediaSchema exactly
// — view_image is handled separately as File state below (multipart, not
// part of this JSON-shaped schema). view_link is a plain URL string.
const newsMediaFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255, "Title is too long"),
  location: z.string().trim().max(255, "Location is too long").optional(),
  date: z.string().optional(),
  view_link: z.string().trim().max(500, "Link is too long").optional(),
  status: z.enum(["active", "inactive"]),
});

type NewsMediaFormValues = z.infer<typeof newsMediaFormSchema>;

type NewsMediaFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  newsMediaId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function NewsMediaFormDialog({ open, mode, newsMediaId, onOpenChange }: NewsMediaFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add News & Media" : "Edit News & Media"}
      description={mode === "create" ? "Create a new news & media item." : "Update this news & media item's details."}
    >
      {open && (
        <NewsMediaFormBody
          key={mode === "edit" ? (newsMediaId ?? "edit") : "create"}
          mode={mode}
          newsMediaId={newsMediaId}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function NewsMediaFormBody({
  mode,
  newsMediaId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  newsMediaId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const newsMediaQuery = useQuery({
    queryKey: newsMediaKeys.detail(newsMediaId ?? -1),
    queryFn: () => getNewsMediaItem(newsMediaId as number),
    enabled: mode === "edit" && newsMediaId !== null,
  });

  if (mode === "edit" && newsMediaQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading news & media item…
      </div>
    );
  }

  if (mode === "edit" && newsMediaQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {newsMediaQuery.error instanceof ApiError ? newsMediaQuery.error.message : "Failed to load news & media item."}
      </p>
    );
  }

  return (
    <NewsMediaForm
      mode={mode}
      newsMediaId={newsMediaId}
      initialItem={newsMediaQuery.data?.newsMediaItem}
      onOpenChange={onOpenChange}
    />
  );
}

/** Converts a stored ISO datetime into the `yyyy-MM-dd` shape `<input type="date">` needs. */
function toDateInputValue(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function NewsMediaForm({
  mode,
  newsMediaId,
  initialItem,
  onOpenChange,
}: {
  mode: "create" | "edit";
  newsMediaId: number | null;
  initialItem?: NewsMedia;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<NewsMediaFormValues>({
    resolver: zodResolver(newsMediaFormSchema),
    defaultValues: {
      title: initialItem?.title ?? "",
      location: initialItem?.location ?? "",
      date: toDateInputValue(initialItem?.date),
      view_link: initialItem?.view_link ?? "",
      status: initialItem?.status === "inactive" ? "inactive" : "active",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: NewsMediaFormValues) => {
      const payload = {
        title: values.title,
        location: values.location ? values.location : null,
        date: values.date ? values.date : null,
        view_link: values.view_link ? values.view_link : null,
        status: values.status,
      };
      if (mode === "create") {
        return createNewsMediaItem(payload, imageFiles[0]);
      }
      return updateNewsMediaItem(newsMediaId as number, payload, imageFiles[0]);
    },
    onSuccess: () => {
      notify.success(mode === "create" ? "News & media item created successfully." : "News & media item updated successfully.");
      queryClient.invalidateQueries({ queryKey: newsMediaKeys.all });
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: NewsMediaFormValues) => {
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
          <Field className="sm:col-span-2" data-invalid={!!errors.title || undefined}>
            <FieldLabel htmlFor="news-media-title">
              Title <span className="text-destructive">*</span>
            </FieldLabel>
            <Input id="news-media-title" aria-invalid={!!errors.title || undefined} {...register("title")} />
            <FieldError errors={[errors.title]} />
          </Field>

          <Field data-invalid={!!errors.location || undefined}>
            <FieldLabel htmlFor="news-media-location">
              Location <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="news-media-location" {...register("location")} />
            <FieldError errors={[errors.location]} />
          </Field>

          <Field data-invalid={!!errors.date || undefined}>
            <FieldLabel htmlFor="news-media-date">
              Date <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="news-media-date" type="date" {...register("date")} />
            <FieldError errors={[errors.date]} />
          </Field>

          <Field data-invalid={!!errors.status || undefined}>
            <FieldLabel htmlFor="news-media-status">Status</FieldLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="news-media-status" className="w-full">
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

          <Field data-invalid={!!errors.view_link || undefined}>
            <FieldLabel htmlFor="news-media-view-link">
              View Link <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="news-media-view-link" placeholder="https://…" {...register("view_link")} />
            <FieldError errors={[errors.view_link]} />
          </Field>

          <Field className="sm:col-span-2">
            <FieldLabel>
              View Image <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            {mode === "edit" && initialItem?.view_image && imageFiles.length === 0 && (
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- small preview of the currently stored image. */}
                <img
                  src={initialItem.view_image}
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
          {mode === "create" ? "Create News & Media" : "Save Changes"}
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
