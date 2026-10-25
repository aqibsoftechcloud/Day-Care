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
import { createLocation, getLocation, updateLocation } from "@/lib/api/locations";
import { listCities } from "@/lib/api/cities";
import { notify } from "@/lib/toast";
import { locationsKeys } from "@/components/admin/locations/queries";
import { citiesKeys } from "@/components/admin/cities/queries";
import type { Location } from "@/types/location";

// Mirrors validators/location.validator.ts's createLocationSchema exactly.
const locationFormSchema = z.object({
  area: z.string().trim().min(1, "Area is required").max(150, "Area is too long"),
  zipcode: z.string().trim().min(1, "Zipcode is required").max(20, "Zipcode is too long"),
  city_id: z.string().min(1, "City is required"),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255, "SEO URL is too long"),
  meta_title: z.string().trim().max(255, "Meta title is too long").optional(),
  meta_description: z.string().trim().optional(),
  meta_keywords: z.string().trim().max(500, "Meta keywords is too long").optional(),
  status: z.enum(["active", "inactive"]),
});

type LocationFormValues = z.infer<typeof locationFormSchema>;

type LocationFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  locationId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function LocationFormDialog({ open, mode, locationId, onOpenChange }: LocationFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add Location" : "Edit Location"}
      description={mode === "create" ? "Create a new location." : "Update this location's details."}
      className="sm:max-w-4xl"
    >
      {/* Keyed by location so re-opening for a different location remounts
          with fresh defaultValues instead of needing a reset-in-effect. */}
      {open && (
        <LocationFormBody
          key={mode === "edit" ? (locationId ?? "edit") : "create"}
          mode={mode}
          locationId={locationId}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function LocationFormBody({
  mode,
  locationId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  locationId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const locationQuery = useQuery({
    queryKey: locationsKeys.detail(locationId ?? -1),
    queryFn: () => getLocation(locationId as number),
    enabled: mode === "edit" && locationId !== null,
  });

  if (mode === "edit" && locationQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading location…
      </div>
    );
  }

  if (mode === "edit" && locationQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {locationQuery.error instanceof ApiError ? locationQuery.error.message : "Failed to load location."}
      </p>
    );
  }

  return (
    <LocationForm
      mode={mode}
      locationId={locationId}
      initialLocation={locationQuery.data?.location}
      onOpenChange={onOpenChange}
    />
  );
}

function LocationForm({
  mode,
  locationId,
  initialLocation,
  onOpenChange,
}: {
  mode: "create" | "edit";
  locationId: number | null;
  initialLocation?: Location;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const citiesQuery = useQuery({ queryKey: citiesKeys.all, queryFn: listCities });
  const cities = citiesQuery.data?.cities ?? [];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      area: initialLocation?.area ?? "",
      zipcode: initialLocation?.zipcode ?? "",
      city_id: initialLocation ? String(initialLocation.city_id) : "",
      seo_url: initialLocation?.seo_url ?? "",
      meta_title: initialLocation?.meta_title ?? "",
      meta_description: initialLocation?.meta_description ?? "",
      meta_keywords: initialLocation?.meta_keywords ?? "",
      status: initialLocation?.status === "inactive" ? "inactive" : "active",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: LocationFormValues) => {
      const payload = {
        area: values.area,
        zipcode: values.zipcode,
        city_id: Number(values.city_id),
        seo_url: values.seo_url,
        meta_title: values.meta_title ? values.meta_title : null,
        meta_description: values.meta_description ? values.meta_description : null,
        meta_keywords: values.meta_keywords ? values.meta_keywords : null,
        status: values.status,
      };
      if (mode === "create") {
        return createLocation(payload);
      }
      return updateLocation(locationId as number, payload);
    },
    onSuccess: () => {
      notify.success(mode === "create" ? "Location created successfully." : "Location updated successfully.");
      queryClient.invalidateQueries({ queryKey: locationsKeys.all });
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: LocationFormValues) => {
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
          Location Information
        </FieldLegend>
        <FormFieldGrid>
          <Field data-invalid={!!errors.area || undefined}>
            <FieldLabel htmlFor="location-area">
              Area <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="location-area"
              placeholder="e.g. Andheri West"
              aria-invalid={!!errors.area || undefined}
              {...register("area")}
            />
            <FieldError errors={[errors.area]} />
          </Field>

          <Field data-invalid={!!errors.zipcode || undefined}>
            <FieldLabel htmlFor="location-zipcode">
              Zipcode <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="location-zipcode"
              placeholder="e.g. 400058"
              aria-invalid={!!errors.zipcode || undefined}
              {...register("zipcode")}
            />
            <FieldError errors={[errors.zipcode]} />
          </Field>

          <Field data-invalid={!!errors.city_id || undefined}>
            <FieldLabel htmlFor="location-city">
              City <span className="text-destructive">*</span>
            </FieldLabel>
            <Controller
              name="city_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={citiesQuery.isLoading}>
                  <SelectTrigger id="location-city" className="w-full">
                    <SelectValue placeholder={citiesQuery.isLoading ? "Loading cities…" : "Select a city"} />
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

          <Field data-invalid={!!errors.status || undefined}>
            <FieldLabel htmlFor="location-status">Status</FieldLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="location-status" className="w-full">
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
          SEO
        </FieldLegend>
        <FormFieldGrid>
          <Field className="sm:col-span-2" data-invalid={!!errors.seo_url || undefined}>
            <FieldLabel htmlFor="location-seo-url">
              SEO URL <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="location-seo-url"
              placeholder="e.g. andheri-west"
              aria-invalid={!!errors.seo_url || undefined}
              {...register("seo_url")}
            />
            <FieldError errors={[errors.seo_url]} />
          </Field>

          <Field data-invalid={!!errors.meta_title || undefined}>
            <FieldLabel htmlFor="location-meta-title">
              Meta Title <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input
              id="location-meta-title"
              aria-invalid={!!errors.meta_title || undefined}
              {...register("meta_title")}
            />
            <FieldError errors={[errors.meta_title]} />
          </Field>

          <Field data-invalid={!!errors.meta_keywords || undefined}>
            <FieldLabel htmlFor="location-meta-keywords">
              Meta Keywords <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="location-meta-keywords" {...register("meta_keywords")} />
            <FieldError errors={[errors.meta_keywords]} />
          </Field>

          <Field className="sm:col-span-2" data-invalid={!!errors.meta_description || undefined}>
            <FieldLabel htmlFor="location-meta-description">
              Meta Description <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Textarea id="location-meta-description" rows={3} {...register("meta_description")} />
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
          {mode === "create" ? "Create Location" : "Save Changes"}
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
