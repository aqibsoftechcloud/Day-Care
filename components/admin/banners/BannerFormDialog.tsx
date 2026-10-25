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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { ApiError } from "@/lib/api/client";
import { createBanner, getBanner, updateBanner } from "@/lib/api/banners";
import { listCities } from "@/lib/api/cities";
import { notify } from "@/lib/toast";
import { bannersKeys } from "@/components/admin/banners/queries";
import { citiesKeys } from "@/components/admin/cities/queries";
import type { Banner } from "@/types/banner";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const IMAGE_HINT = "JPG, PNG, WEBP or GIF, up to 5MB";

// Mirrors validators/banner.validator.ts's createBannerSchema exactly —
// banner_image/mobile_banner_image are handled separately as File state
// below since they're multipart files, not part of this JSON-shaped schema.
const bannerFormSchema = z.object({
  banner_name: z.string().trim().min(1, "Banner name is required").max(255, "Banner name is too long"),
  banner_url: z.string().trim().max(500, "Banner URL is too long").optional(),
  city_id: z.string().min(1, "City is required"),
  sorting_order: z.string().trim().refine((v) => v === "" || /^-?\d+$/.test(v), "Enter a whole number"),
  status: z.enum(["active", "inactive"]),
});

type BannerFormValues = z.infer<typeof bannerFormSchema>;

type BannerFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  bannerId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function BannerFormDialog({ open, mode, bannerId, onOpenChange }: BannerFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add Banner" : "Edit Banner"}
      description={mode === "create" ? "Create a new banner." : "Update this banner's details."}
      className="sm:max-w-4xl"
    >
      {open && (
        <BannerFormBody
          key={mode === "edit" ? (bannerId ?? "edit") : "create"}
          mode={mode}
          bannerId={bannerId}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function BannerFormBody({
  mode,
  bannerId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  bannerId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const bannerQuery = useQuery({
    queryKey: bannersKeys.detail(bannerId ?? -1),
    queryFn: () => getBanner(bannerId as number),
    enabled: mode === "edit" && bannerId !== null,
  });

  if (mode === "edit" && bannerQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading banner…
      </div>
    );
  }

  if (mode === "edit" && bannerQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {bannerQuery.error instanceof ApiError ? bannerQuery.error.message : "Failed to load banner."}
      </p>
    );
  }

  return (
    <BannerForm mode={mode} bannerId={bannerId} initialBanner={bannerQuery.data?.banner} onOpenChange={onOpenChange} />
  );
}

function BannerForm({
  mode,
  bannerId,
  initialBanner,
  onOpenChange,
}: {
  mode: "create" | "edit";
  bannerId: number | null;
  initialBanner?: Banner;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const citiesQuery = useQuery({ queryKey: citiesKeys.all, queryFn: listCities });
  const cities = citiesQuery.data?.cities ?? [];

  const [bannerImageFiles, setBannerImageFiles] = useState<File[]>([]);
  const [mobileBannerImageFiles, setMobileBannerImageFiles] = useState<File[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: {
      banner_name: initialBanner?.banner_name ?? "",
      banner_url: initialBanner?.banner_url ?? "",
      city_id: initialBanner ? String(initialBanner.city_id) : "",
      sorting_order: initialBanner ? String(initialBanner.sorting_order) : "0",
      status: initialBanner?.status === "inactive" ? "inactive" : "active",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: BannerFormValues) => {
      const payload = {
        banner_name: values.banner_name,
        banner_url: values.banner_url ? values.banner_url : null,
        city_id: Number(values.city_id),
        sorting_order: values.sorting_order === "" ? 0 : Number(values.sorting_order),
        status: values.status,
      };
      if (mode === "create") {
        return createBanner(payload, {
          banner_image: bannerImageFiles[0],
          mobile_banner_image: mobileBannerImageFiles[0] ?? null,
        });
      }
      return updateBanner(bannerId as number, payload, {
        banner_image: bannerImageFiles[0] ?? null,
        mobile_banner_image: mobileBannerImageFiles[0] ?? null,
      });
    },
    onSuccess: () => {
      notify.success(mode === "create" ? "Banner created successfully." : "Banner updated successfully.");
      queryClient.invalidateQueries({ queryKey: bannersKeys.all });
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: BannerFormValues) => {
    if (mode === "create" && bannerImageFiles.length === 0) {
      setImageError("Banner image is required.");
      return;
    }
    setImageError(null);
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

      <FormFieldGrid>
        <Field className="sm:col-span-2" data-invalid={!!errors.banner_name || undefined}>
          <FieldLabel htmlFor="banner-name">
            Banner Name <span className="text-destructive">*</span>
          </FieldLabel>
          <Input id="banner-name" aria-invalid={!!errors.banner_name || undefined} {...register("banner_name")} />
          <FieldError errors={[errors.banner_name]} />
        </Field>

        <Field data-invalid={!!errors.city_id || undefined}>
          <FieldLabel htmlFor="banner-city">
            City <span className="text-destructive">*</span>
          </FieldLabel>
          <Controller
            name="city_id"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={citiesQuery.isLoading}>
                <SelectTrigger id="banner-city" className="w-full">
                  <SelectValue placeholder={citiesQuery.isLoading ? "Loading…" : "Select a city"} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={String(city.id)}>
                      {city.city_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.city_id]} />
        </Field>

        <Field data-invalid={!!errors.sorting_order || undefined}>
          <FieldLabel htmlFor="banner-sorting-order">Sorting Order</FieldLabel>
          <Input
            id="banner-sorting-order"
            type="number"
            step="1"
            aria-invalid={!!errors.sorting_order || undefined}
            {...register("sorting_order")}
          />
          <FieldError errors={[errors.sorting_order]} />
        </Field>

        <Field data-invalid={!!errors.status || undefined}>
          <FieldLabel htmlFor="banner-status">Status</FieldLabel>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="banner-status" className="w-full">
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

        <Field className="sm:col-span-2" data-invalid={!!errors.banner_url || undefined}>
          <FieldLabel htmlFor="banner-url">
            Banner URL <span className="text-muted-foreground">(optional — where the banner links to)</span>
          </FieldLabel>
          <Input id="banner-url" placeholder="https://…" {...register("banner_url")} />
          <FieldError errors={[errors.banner_url]} />
        </Field>

        <Field className="sm:col-span-2">
          <FieldLabel>
            Banner Image <span className="text-destructive">*</span>
          </FieldLabel>
          {mode === "edit" && initialBanner && bannerImageFiles.length === 0 && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- small preview of the currently stored image. */}
              <img src={initialBanner.banner_image} alt="" className="size-10 rounded-md border border-border object-cover" />
              <span className="text-body-sm text-muted-foreground">Current image — upload a new file to replace it.</span>
            </div>
          )}
          <FileUploadArea
            files={bannerImageFiles}
            onFilesChange={(files) => {
              setBannerImageFiles(files);
              if (files.length > 0) setImageError(null);
            }}
            accept={IMAGE_ACCEPT}
            hint={IMAGE_HINT}
            disabled={mutation.isPending}
            error={imageError ?? undefined}
          />
        </Field>

        <Field className="sm:col-span-2">
          <FieldLabel>
            Mobile Banner Image <span className="text-muted-foreground">(optional)</span>
          </FieldLabel>
          {mode === "edit" && initialBanner?.mobile_banner_image && mobileBannerImageFiles.length === 0 && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- small preview of the currently stored image. */}
              <img
                src={initialBanner.mobile_banner_image}
                alt=""
                className="size-10 rounded-md border border-border object-cover"
              />
              <span className="text-body-sm text-muted-foreground">Current image — upload a new file to replace it.</span>
            </div>
          )}
          <FileUploadArea
            files={mobileBannerImageFiles}
            onFilesChange={setMobileBannerImageFiles}
            accept={IMAGE_ACCEPT}
            hint={IMAGE_HINT}
            disabled={mutation.isPending}
          />
        </Field>
      </FormFieldGrid>

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
          {mode === "create" ? "Create Banner" : "Save Changes"}
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
