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
import { createCity, getCity, updateCity } from "@/lib/api/cities";
import { listLanguages } from "@/lib/api/languages";
import { notify } from "@/lib/toast";
import { citiesKeys } from "@/components/admin/cities/queries";
import { languagesKeys } from "@/components/admin/languages/queries";
import type { City } from "@/types/city";

// Mirrors validators/city.validator.ts's createCitySchema exactly.
const cityFormSchema = z.object({
  city_name: z.string().trim().min(1, "City name is required").max(150, "City name is too long"),
  language_id: z.string().min(1, "Language is required"),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255, "SEO URL is too long"),
  meta_title: z.string().trim().max(255, "Meta title is too long").optional(),
  meta_description: z.string().trim().optional(),
  meta_keywords: z.string().trim().max(500, "Meta keywords is too long").optional(),
  status: z.enum(["active", "inactive"]),
});

type CityFormValues = z.infer<typeof cityFormSchema>;

type CityFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  cityId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function CityFormDialog({ open, mode, cityId, onOpenChange }: CityFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add City" : "Edit City"}
      description={mode === "create" ? "Create a new city." : "Update this city's details."}
      className="sm:max-w-4xl"
    >
      {/* Keyed by city so re-opening for a different city remounts with
          fresh defaultValues instead of needing a reset-in-effect. */}
      {open && (
        <CityFormBody
          key={mode === "edit" ? (cityId ?? "edit") : "create"}
          mode={mode}
          cityId={cityId}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function CityFormBody({
  mode,
  cityId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  cityId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const cityQuery = useQuery({
    queryKey: citiesKeys.detail(cityId ?? -1),
    queryFn: () => getCity(cityId as number),
    enabled: mode === "edit" && cityId !== null,
  });

  if (mode === "edit" && cityQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading city…
      </div>
    );
  }

  if (mode === "edit" && cityQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {cityQuery.error instanceof ApiError ? cityQuery.error.message : "Failed to load city."}
      </p>
    );
  }

  return (
    <CityForm mode={mode} cityId={cityId} initialCity={cityQuery.data?.city} onOpenChange={onOpenChange} />
  );
}

function CityForm({
  mode,
  cityId,
  initialCity,
  onOpenChange,
}: {
  mode: "create" | "edit";
  cityId: number | null;
  initialCity?: City;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const languagesQuery = useQuery({ queryKey: languagesKeys.all, queryFn: listLanguages });
  const languages = languagesQuery.data?.languages ?? [];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CityFormValues>({
    resolver: zodResolver(cityFormSchema),
    defaultValues: {
      city_name: initialCity?.city_name ?? "",
      language_id: initialCity ? String(initialCity.language_id) : "",
      seo_url: initialCity?.seo_url ?? "",
      meta_title: initialCity?.meta_title ?? "",
      meta_description: initialCity?.meta_description ?? "",
      meta_keywords: initialCity?.meta_keywords ?? "",
      status: initialCity?.status === "inactive" ? "inactive" : "active",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: CityFormValues) => {
      const payload = {
        city_name: values.city_name,
        language_id: Number(values.language_id),
        seo_url: values.seo_url,
        meta_title: values.meta_title ? values.meta_title : null,
        meta_description: values.meta_description ? values.meta_description : null,
        meta_keywords: values.meta_keywords ? values.meta_keywords : null,
        status: values.status,
      };
      if (mode === "create") {
        return createCity(payload);
      }
      return updateCity(cityId as number, payload);
    },
    onSuccess: () => {
      notify.success(mode === "create" ? "City created successfully." : "City updated successfully.");
      queryClient.invalidateQueries({ queryKey: citiesKeys.all });
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: CityFormValues) => {
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
          City Information
        </FieldLegend>
        <FormFieldGrid>
          <Field className="sm:col-span-2" data-invalid={!!errors.city_name || undefined}>
            <FieldLabel htmlFor="city-name">
              City Name <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="city-name"
              placeholder="e.g. Mumbai"
              aria-invalid={!!errors.city_name || undefined}
              {...register("city_name")}
            />
            <FieldError errors={[errors.city_name]} />
          </Field>

          <Field data-invalid={!!errors.language_id || undefined}>
            <FieldLabel htmlFor="city-language">
              Language <span className="text-destructive">*</span>
            </FieldLabel>
            <Controller
              name="language_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={languagesQuery.isLoading}>
                  <SelectTrigger id="city-language" className="w-full">
                    <SelectValue placeholder={languagesQuery.isLoading ? "Loading languages…" : "Select a language"} />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((language) => (
                      <SelectItem key={language.id} value={String(language.id)}>
                        {language.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.language_id]} />
          </Field>

          <Field data-invalid={!!errors.status || undefined}>
            <FieldLabel htmlFor="city-status">Status</FieldLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="city-status" className="w-full">
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
            <FieldLabel htmlFor="city-seo-url">
              SEO URL <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="city-seo-url"
              placeholder="e.g. mumbai"
              aria-invalid={!!errors.seo_url || undefined}
              {...register("seo_url")}
            />
            <FieldError errors={[errors.seo_url]} />
          </Field>

          <Field data-invalid={!!errors.meta_title || undefined}>
            <FieldLabel htmlFor="city-meta-title">
              Meta Title <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="city-meta-title" aria-invalid={!!errors.meta_title || undefined} {...register("meta_title")} />
            <FieldError errors={[errors.meta_title]} />
          </Field>

          <Field data-invalid={!!errors.meta_keywords || undefined}>
            <FieldLabel htmlFor="city-meta-keywords">
              Meta Keywords <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="city-meta-keywords" {...register("meta_keywords")} />
            <FieldError errors={[errors.meta_keywords]} />
          </Field>

          <Field className="sm:col-span-2" data-invalid={!!errors.meta_description || undefined}>
            <FieldLabel htmlFor="city-meta-description">
              Meta Description <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Textarea id="city-meta-description" rows={3} {...register("meta_description")} />
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
          {mode === "create" ? "Create City" : "Save Changes"}
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
