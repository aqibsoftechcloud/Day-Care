"use client";

import { useMemo } from "react";
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
import { RichTextEditor } from "@/components/admin/editor/RichTextEditor";
import { ApiError } from "@/lib/api/client";
import { createDoctorPage, getDoctorPage, updateDoctorPage } from "@/lib/api/doctor-pages";
import { listCities } from "@/lib/api/cities";
import { listLocations } from "@/lib/api/locations";
import { listSpecialities } from "@/lib/api/specialities";
import { notify } from "@/lib/toast";
import { doctorPagesKeys, specialitiesKeys } from "@/components/admin/doctor-pages/queries";
import { citiesKeys } from "@/components/admin/cities/queries";
import { locationsKeys } from "@/components/admin/locations/queries";
import type { DoctorPage } from "@/types/doctor-page";

const NO_LOCATION_VALUE = "none";

// Mirrors validators/doctor-page.validator.ts's createDoctorPageSchema exactly.
// Note: no language_id/doctor_id field — this model has neither relation.
const doctorPageFormSchema = z.object({
  pagename: z.string().trim().min(1, "Page name is required").max(255, "Page name is too long"),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255, "SEO URL is too long"),
  city_id: z.string().min(1, "City is required"),
  location_id: z.string(),
  speciality_id: z.string().min(1, "Speciality is required"),
  keyword: z.string().trim().max(500, "Keyword is too long").optional(),
  description: z.string().optional(),
  meta_title: z.string().trim().max(255, "Meta title is too long").optional(),
  meta_description: z.string().trim().optional(),
  meta_keywords: z.string().trim().max(500, "Meta keywords is too long").optional(),
  status: z.enum(["active", "inactive"]),
});

type DoctorPageFormValues = z.infer<typeof doctorPageFormSchema>;

type DoctorPageFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  doctorPageId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function DoctorPageFormDialog({ open, mode, doctorPageId, onOpenChange }: DoctorPageFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add Doctor Page" : "Edit Doctor Page"}
      description={mode === "create" ? "Create a new doctor page." : "Update this doctor page's details."}
      className="sm:max-w-4xl"
    >
      {open && (
        <DoctorPageFormBody
          key={mode === "edit" ? (doctorPageId ?? "edit") : "create"}
          mode={mode}
          doctorPageId={doctorPageId}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function DoctorPageFormBody({
  mode,
  doctorPageId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  doctorPageId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const doctorPageQuery = useQuery({
    queryKey: doctorPagesKeys.detail(doctorPageId ?? -1),
    queryFn: () => getDoctorPage(doctorPageId as number),
    enabled: mode === "edit" && doctorPageId !== null,
  });

  if (mode === "edit" && doctorPageQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading doctor page…
      </div>
    );
  }

  if (mode === "edit" && doctorPageQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {doctorPageQuery.error instanceof ApiError ? doctorPageQuery.error.message : "Failed to load doctor page."}
      </p>
    );
  }

  return (
    <DoctorPageForm
      mode={mode}
      doctorPageId={doctorPageId}
      initialDoctorPage={doctorPageQuery.data?.doctorPage}
      onOpenChange={onOpenChange}
    />
  );
}

function DoctorPageForm({
  mode,
  doctorPageId,
  initialDoctorPage,
  onOpenChange,
}: {
  mode: "create" | "edit";
  doctorPageId: number | null;
  initialDoctorPage?: DoctorPage;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const citiesQuery = useQuery({ queryKey: citiesKeys.all, queryFn: listCities });
  const locationsQuery = useQuery({ queryKey: locationsKeys.all, queryFn: listLocations });
  const specialitiesQuery = useQuery({ queryKey: specialitiesKeys.all, queryFn: () => listSpecialities() });

  const cities = citiesQuery.data?.cities ?? [];
  const allLocations = useMemo(() => locationsQuery.data?.locations ?? [], [locationsQuery.data]);
  const specialities = specialitiesQuery.data?.specialities ?? [];

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DoctorPageFormValues>({
    resolver: zodResolver(doctorPageFormSchema),
    defaultValues: {
      pagename: initialDoctorPage?.pagename ?? "",
      seo_url: initialDoctorPage?.seo_url ?? "",
      city_id: initialDoctorPage ? String(initialDoctorPage.city_id) : "",
      location_id: initialDoctorPage?.location_id ? String(initialDoctorPage.location_id) : NO_LOCATION_VALUE,
      speciality_id: initialDoctorPage ? String(initialDoctorPage.speciality_id) : "",
      keyword: initialDoctorPage?.keyword ?? "",
      description: initialDoctorPage?.description ?? "",
      meta_title: initialDoctorPage?.meta_title ?? "",
      meta_description: initialDoctorPage?.meta_description ?? "",
      meta_keywords: initialDoctorPage?.meta_keywords ?? "",
      status: initialDoctorPage?.status === "inactive" ? "inactive" : "active",
    },
  });

  const selectedCityId = watch("city_id");

  const locationOptions = useMemo(
    () => allLocations.filter((location) => String(location.city_id) === selectedCityId),
    [allLocations, selectedCityId]
  );

  const mutation = useMutation({
    mutationFn: async (values: DoctorPageFormValues) => {
      const payload = {
        pagename: values.pagename,
        seo_url: values.seo_url,
        city_id: Number(values.city_id),
        location_id: values.location_id === NO_LOCATION_VALUE ? null : Number(values.location_id),
        speciality_id: Number(values.speciality_id),
        keyword: values.keyword ? values.keyword : null,
        description: values.description ? values.description : null,
        meta_title: values.meta_title ? values.meta_title : null,
        meta_description: values.meta_description ? values.meta_description : null,
        meta_keywords: values.meta_keywords ? values.meta_keywords : null,
        status: values.status,
      };
      if (mode === "create") {
        return createDoctorPage(payload);
      }
      return updateDoctorPage(doctorPageId as number, payload);
    },
    onSuccess: () => {
      notify.success(mode === "create" ? "Doctor page created successfully." : "Doctor page updated successfully.");
      queryClient.invalidateQueries({ queryKey: doctorPagesKeys.all });
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: DoctorPageFormValues) => {
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
          Doctor Page Information
        </FieldLegend>
        <FormFieldGrid>
          <Field className="sm:col-span-2" data-invalid={!!errors.pagename || undefined}>
            <FieldLabel htmlFor="doctor-page-pagename">
              Page Name <span className="text-destructive">*</span>
            </FieldLabel>
            <Input id="doctor-page-pagename" aria-invalid={!!errors.pagename || undefined} {...register("pagename")} />
            <FieldError errors={[errors.pagename]} />
          </Field>

          <Field data-invalid={!!errors.speciality_id || undefined}>
            <FieldLabel htmlFor="doctor-page-speciality">
              Speciality <span className="text-destructive">*</span>
            </FieldLabel>
            <Controller
              name="speciality_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={specialitiesQuery.isLoading}>
                  <SelectTrigger id="doctor-page-speciality" className="w-full">
                    <SelectValue placeholder={specialitiesQuery.isLoading ? "Loading…" : "Select a speciality"} />
                  </SelectTrigger>
                  <SelectContent>
                    {specialities.map((speciality) => (
                      <SelectItem key={speciality.id} value={String(speciality.id)}>
                        {speciality.speciality_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.speciality_id]} />
          </Field>

          <Field data-invalid={!!errors.city_id || undefined}>
            <FieldLabel htmlFor="doctor-page-city">
              City <span className="text-destructive">*</span>
            </FieldLabel>
            <Controller
              name="city_id"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setValue("location_id", NO_LOCATION_VALUE);
                  }}
                  disabled={citiesQuery.isLoading}
                >
                  <SelectTrigger id="doctor-page-city" className="w-full">
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

          <Field data-invalid={!!errors.location_id || undefined}>
            <FieldLabel htmlFor="doctor-page-location">Location</FieldLabel>
            <Controller
              name="location_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!selectedCityId}>
                  <SelectTrigger id="doctor-page-location" className="w-full">
                    <SelectValue placeholder={selectedCityId ? "Select a location" : "Select a city first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_LOCATION_VALUE}>None</SelectItem>
                    {locationOptions.map((location) => (
                      <SelectItem key={location.id} value={String(location.id)}>
                        {location.area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.location_id]} />
          </Field>

          <Field data-invalid={!!errors.keyword || undefined}>
            <FieldLabel htmlFor="doctor-page-keyword">
              Keyword <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="doctor-page-keyword" {...register("keyword")} />
            <FieldError errors={[errors.keyword]} />
          </Field>

          <Field data-invalid={!!errors.status || undefined}>
            <FieldLabel htmlFor="doctor-page-status">Status</FieldLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="doctor-page-status" className="w-full">
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
          Page Content
        </FieldLegend>
        <Field data-invalid={!!errors.description || undefined}>
          <FieldLabel htmlFor="doctor-page-description">
            Description <span className="text-muted-foreground">(optional)</span>
          </FieldLabel>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                id="doctor-page-description"
                value={field.value ?? ""}
                onChange={field.onChange}
                placeholder="Start writing the content for this doctor page..."
                error={!!errors.description}
              />
            )}
          />
          <FieldError errors={[errors.description]} />
        </Field>
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
          SEO
        </FieldLegend>
        <FormFieldGrid>
          <Field className="sm:col-span-2" data-invalid={!!errors.seo_url || undefined}>
            <FieldLabel htmlFor="doctor-page-seo-url">
              SEO URL <span className="text-destructive">*</span>
            </FieldLabel>
            <Input id="doctor-page-seo-url" aria-invalid={!!errors.seo_url || undefined} {...register("seo_url")} />
            <FieldError errors={[errors.seo_url]} />
          </Field>

          <Field data-invalid={!!errors.meta_title || undefined}>
            <FieldLabel htmlFor="doctor-page-meta-title">
              Meta Title <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="doctor-page-meta-title" {...register("meta_title")} />
            <FieldError errors={[errors.meta_title]} />
          </Field>

          <Field data-invalid={!!errors.meta_keywords || undefined}>
            <FieldLabel htmlFor="doctor-page-meta-keywords">
              Meta Keywords <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="doctor-page-meta-keywords" {...register("meta_keywords")} />
            <FieldError errors={[errors.meta_keywords]} />
          </Field>

          <Field className="sm:col-span-2" data-invalid={!!errors.meta_description || undefined}>
            <FieldLabel htmlFor="doctor-page-meta-description">
              Meta Description <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Textarea id="doctor-page-meta-description" rows={3} {...register("meta_description")} />
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
          {mode === "create" ? "Create Doctor Page" : "Save Changes"}
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
