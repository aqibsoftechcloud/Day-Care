"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/admin/FormDialog";
import { FormFieldGrid } from "@/components/admin/FormFieldGrid";
import { LoadingButton } from "@/components/admin/LoadingButton";
import { FileUploadArea } from "@/components/admin/FileUploadArea";
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
import { createHospital, getHospital, updateHospital } from "@/lib/api/hospitals";
import { listCities } from "@/lib/api/cities";
import { listLocations } from "@/lib/api/locations";
import { notify } from "@/lib/toast";
import { hospitalsKeys } from "@/components/admin/hospitals/queries";
import { citiesKeys } from "@/components/admin/cities/queries";
import { locationsKeys } from "@/components/admin/locations/queries";
import { HospitalWhyChooseUsDialog } from "@/components/admin/hospitals/HospitalWhyChooseUsDialog";
import { HospitalFinalCtaDialog } from "@/components/admin/hospitals/HospitalFinalCtaDialog";
import { HospitalGalleryDialog } from "@/components/admin/hospitals/HospitalGalleryDialog";
import { HospitalInsuranceDialog } from "@/components/admin/hospitals/HospitalInsuranceDialog";
import type { Hospital } from "@/types/hospital";

const NO_LOCATION_VALUE = "none";
const decimalPattern = /^-?\d+(\.\d+)?$/;
const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const IMAGE_HINT = "JPG, PNG, WEBP or GIF, up to 5MB";

// Mirrors validators/hospital.validator.ts's createHospitalSchema exactly —
// `hospital_gallery` is deliberately omitted: it's an untyped Json column
// with no documented shape anywhere in the backend (validator/service both
// just pass it through as `unknown`), so this form doesn't touch it at
// all rather than inventing a structure for it.
const hospitalFormSchema = z.object({
  hospital_name: z.string().trim().min(1, "Hospital name is required").max(255, "Name is too long"),
  city_id: z.string().min(1, "City is required"),
  location_id: z.string(),
  phone_number: z.string().trim().max(50, "Phone number is too long").optional(),
  timings: z.string().trim().max(255, "Timings is too long").optional(),
  google_reviews: z.string().trim().refine((v) => v === "" || decimalPattern.test(v), "Enter a valid number").optional(),
  patient_satisfaction_score: z
    .string()
    .trim()
    .refine((v) => v === "" || decimalPattern.test(v), "Enter a valid number")
    .optional(),
  hospital_image: z.string().trim().max(500, "Image URL is too long").optional(),
  address: z.string().trim().optional(),
  hospital_description: z.string().trim().optional(),
  long_description: z.string().optional(),
  location_360_view: z.string().trim().max(1000, "URL is too long").optional(),
  location_map: z.string().trim().optional(),
  status: z.enum(["active", "inactive"]),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255, "SEO URL is too long"),
  meta_title: z.string().trim().max(255, "Meta title is too long").optional(),
  meta_keywords: z.string().trim().max(500, "Meta keywords is too long").optional(),
  meta_description: z.string().trim().optional(),
});

type HospitalFormValues = z.infer<typeof hospitalFormSchema>;

type HospitalFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  hospitalId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function HospitalFormDialog({ open, mode, hospitalId, onOpenChange }: HospitalFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add Hospital" : "Edit Hospital"}
      description={mode === "create" ? "Create a new hospital." : "Update this hospital's details."}
      className="sm:max-w-4xl"
    >
      {open && (
        <HospitalFormBody
          key={mode === "edit" ? (hospitalId ?? "edit") : "create"}
          mode={mode}
          hospitalId={hospitalId}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function HospitalFormBody({
  mode,
  hospitalId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  hospitalId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const hospitalQuery = useQuery({
    queryKey: hospitalsKeys.detail(hospitalId ?? -1),
    queryFn: () => getHospital(hospitalId as number),
    enabled: mode === "edit" && hospitalId !== null,
  });

  if (mode === "edit" && hospitalQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading hospital…
      </div>
    );
  }

  if (mode === "edit" && hospitalQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {hospitalQuery.error instanceof ApiError ? hospitalQuery.error.message : "Failed to load hospital."}
      </p>
    );
  }

  return (
    <HospitalForm
      mode={mode}
      hospitalId={hospitalId}
      initialHospital={hospitalQuery.data?.hospital}
      onOpenChange={onOpenChange}
    />
  );
}

function HospitalForm({
  mode,
  hospitalId,
  initialHospital,
  onOpenChange,
}: {
  mode: "create" | "edit";
  hospitalId: number | null;
  initialHospital?: Hospital;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const [whyChooseUsOpen, setWhyChooseUsOpen] = useState(false);
  const [finalCtaOpen, setFinalCtaOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [insuranceOpen, setInsuranceOpen] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const citiesQuery = useQuery({ queryKey: citiesKeys.all, queryFn: listCities });
  const locationsQuery = useQuery({ queryKey: locationsKeys.all, queryFn: listLocations });

  const cities = citiesQuery.data?.cities ?? [];
  const allLocations = useMemo(() => locationsQuery.data?.locations ?? [], [locationsQuery.data]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<HospitalFormValues>({
    resolver: zodResolver(hospitalFormSchema),
    defaultValues: {
      hospital_name: initialHospital?.hospital_name ?? "",
      city_id: initialHospital ? String(initialHospital.city_id) : "",
      location_id: initialHospital?.location_id ? String(initialHospital.location_id) : NO_LOCATION_VALUE,
      phone_number: initialHospital?.phone_number ?? "",
      timings: initialHospital?.timings ?? "",
      google_reviews: initialHospital?.google_reviews ?? "",
      patient_satisfaction_score: initialHospital?.patient_satisfaction_score ?? "",
      hospital_image: initialHospital?.hospital_image ?? "",
      address: initialHospital?.address ?? "",
      hospital_description: initialHospital?.hospital_description ?? "",
      long_description: initialHospital?.long_description ?? "",
      location_360_view: initialHospital?.location_360_view ?? "",
      location_map: initialHospital?.location_map ?? "",
      status: initialHospital?.status === "inactive" ? "inactive" : "active",
      seo_url: initialHospital?.seo_url ?? "",
      meta_title: initialHospital?.meta_title ?? "",
      meta_keywords: initialHospital?.meta_keywords ?? "",
      meta_description: initialHospital?.meta_description ?? "",
    },
  });

  const selectedCityId = watch("city_id");
  const hospitalImageUrl = watch("hospital_image");

  const locationOptions = useMemo(
    () => allLocations.filter((location) => String(location.city_id) === selectedCityId),
    [allLocations, selectedCityId]
  );

  const mutation = useMutation({
    mutationFn: async (values: HospitalFormValues) => {
      const payload = {
        hospital_name: values.hospital_name,
        city_id: Number(values.city_id),
        location_id: values.location_id === NO_LOCATION_VALUE ? null : Number(values.location_id),
        phone_number: values.phone_number ? values.phone_number : null,
        timings: values.timings ? values.timings : null,
        google_reviews: values.google_reviews ? values.google_reviews : null,
        patient_satisfaction_score: values.patient_satisfaction_score ? values.patient_satisfaction_score : null,
        hospital_image: values.hospital_image ? values.hospital_image : null,
        address: values.address ? values.address : null,
        hospital_description: values.hospital_description ? values.hospital_description : null,
        long_description: values.long_description ? values.long_description : null,
        location_360_view: values.location_360_view ? values.location_360_view : null,
        location_map: values.location_map ? values.location_map : null,
        status: values.status,
        seo_url: values.seo_url,
        meta_title: values.meta_title ? values.meta_title : null,
        meta_keywords: values.meta_keywords ? values.meta_keywords : null,
        meta_description: values.meta_description ? values.meta_description : null,
      };
      if (mode === "create") {
        return createHospital(payload, imageFiles[0]);
      }
      return updateHospital(hospitalId as number, payload, imageFiles[0]);
    },
    onSuccess: () => {
      notify.success(mode === "create" ? "Hospital created successfully." : "Hospital updated successfully.");
      queryClient.invalidateQueries({ queryKey: hospitalsKeys.all });
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: HospitalFormValues) => {
    mutation.mutate(values);
  };

  return (
    <>
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
          Hospital Information
        </FieldLegend>
        <FormFieldGrid>
          <Field className="sm:col-span-2" data-invalid={!!errors.hospital_name || undefined}>
            <FieldLabel htmlFor="hospital-name">
              Hospital Name <span className="text-destructive">*</span>
            </FieldLabel>
            <Input id="hospital-name" aria-invalid={!!errors.hospital_name || undefined} {...register("hospital_name")} />
            <FieldError errors={[errors.hospital_name]} />
          </Field>

          <Field data-invalid={!!errors.city_id || undefined}>
            <FieldLabel htmlFor="hospital-city">
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
                  <SelectTrigger id="hospital-city" className="w-full">
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
            <FieldLabel htmlFor="hospital-location">Location</FieldLabel>
            <Controller
              name="location_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!selectedCityId}>
                  <SelectTrigger id="hospital-location" className="w-full">
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

          <Field data-invalid={!!errors.phone_number || undefined}>
            <FieldLabel htmlFor="hospital-phone">
              Phone Number <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="hospital-phone" {...register("phone_number")} />
            <FieldError errors={[errors.phone_number]} />
          </Field>

          <Field data-invalid={!!errors.timings || undefined}>
            <FieldLabel htmlFor="hospital-timings">
              Timings <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="hospital-timings" placeholder="e.g. 24x7" {...register("timings")} />
            <FieldError errors={[errors.timings]} />
          </Field>

          <Field data-invalid={!!errors.status || undefined}>
            <FieldLabel htmlFor="hospital-status">Status</FieldLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="hospital-status" className="w-full">
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

          <Field data-invalid={!!errors.google_reviews || undefined}>
            <FieldLabel htmlFor="hospital-google-reviews">
              Google Reviews <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="hospital-google-reviews" type="number" step="0.1" {...register("google_reviews")} />
            <FieldError errors={[errors.google_reviews]} />
          </Field>

          <Field data-invalid={!!errors.patient_satisfaction_score || undefined}>
            <FieldLabel htmlFor="hospital-satisfaction-score">
              Patient Satisfaction Score <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="hospital-satisfaction-score" type="number" step="0.01" {...register("patient_satisfaction_score")} />
            <FieldError errors={[errors.patient_satisfaction_score]} />
          </Field>

          <Field className="sm:col-span-2" data-invalid={!!errors.hospital_image || undefined}>
            <FieldLabel htmlFor="hospital-image">
              Hospital Image URL <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <div className="flex items-center gap-3">
              <Input
                id="hospital-image"
                placeholder="https://…"
                className="flex-1"
                {...register("hospital_image")}
              />
              {hospitalImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- small preview of a user-supplied external URL, not an app asset.
                <img
                  src={hospitalImageUrl}
                  alt=""
                  className="size-10 shrink-0 rounded-md border border-border object-contain"
                  onError={(event) => {
                    event.currentTarget.style.visibility = "hidden";
                  }}
                  onLoad={(event) => {
                    event.currentTarget.style.visibility = "visible";
                  }}
                />
              )}
            </div>
            <FieldError errors={[errors.hospital_image]} />
          </Field>

          <Field className="sm:col-span-2">
            <FieldLabel>
              Upload Hospital Image <span className="text-muted-foreground">(optional — overrides the URL above if provided)</span>
            </FieldLabel>
            <FileUploadArea files={imageFiles} onFilesChange={setImageFiles} accept={IMAGE_ACCEPT} hint={IMAGE_HINT} disabled={mutation.isPending} />
          </Field>

          <Field className="sm:col-span-2" data-invalid={!!errors.location_360_view || undefined}>
            <FieldLabel htmlFor="hospital-360-view">
              360° View URL <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="hospital-360-view" placeholder="https://…" {...register("location_360_view")} />
            <FieldError errors={[errors.location_360_view]} />
          </Field>
        </FormFieldGrid>
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
          Content
        </FieldLegend>
        <FormFieldGrid>
          <Field className="sm:col-span-2" data-invalid={!!errors.address || undefined}>
            <FieldLabel htmlFor="hospital-address">
              Address <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Textarea id="hospital-address" rows={2} {...register("address")} />
            <FieldError errors={[errors.address]} />
          </Field>

          <Field className="sm:col-span-2" data-invalid={!!errors.location_map || undefined}>
            <FieldLabel htmlFor="hospital-location-map">
              Location Map <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Textarea id="hospital-location-map" rows={2} {...register("location_map")} />
            <FieldError errors={[errors.location_map]} />
          </Field>

          <Field className="sm:col-span-2" data-invalid={!!errors.hospital_description || undefined}>
            <FieldLabel htmlFor="hospital-description">
              Short Description <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Textarea id="hospital-description" rows={3} {...register("hospital_description")} />
            <FieldError errors={[errors.hospital_description]} />
          </Field>

          <Field className="sm:col-span-2" data-invalid={!!errors.long_description || undefined}>
            <FieldLabel htmlFor="hospital-long-description">
              Description <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Controller
              name="long_description"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  id="hospital-long-description"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Start writing the content for this hospital..."
                  error={!!errors.long_description}
                />
              )}
            />
            <FieldError errors={[errors.long_description]} />
          </Field>
        </FormFieldGrid>
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
          Manage Content
        </FieldLegend>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3">
            <p className="text-helper">Manage the reasons shown in this hospital&apos;s Why Choose Us section.</p>
            <Button type="button" variant="outline" size="sm" disabled={mode !== "edit"} onClick={() => setWhyChooseUsOpen(true)}>
              Manage Why Choose Us
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3">
            <p className="text-helper">Manage the closing &quot;Consult the Doctor Now&quot; call-to-action.</p>
            <Button type="button" variant="outline" size="sm" disabled={mode !== "edit"} onClick={() => setFinalCtaOpen(true)}>
              Manage Final CTA
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3">
            <p className="text-helper">Manage the &quot;Hospital at a Glance&quot; gallery images.</p>
            <Button type="button" variant="outline" size="sm" disabled={mode !== "edit"} onClick={() => setGalleryOpen(true)}>
              Manage Gallery
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3">
            <p className="text-helper">Assign and reorder the insurance companies accepted at this hospital.</p>
            <Button type="button" variant="outline" size="sm" disabled={mode !== "edit"} onClick={() => setInsuranceOpen(true)}>
              Manage Insurance
            </Button>
          </div>
          {mode !== "edit" && <p className="text-helper">Save the hospital first, then manage this content here.</p>}
        </div>
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
          SEO
        </FieldLegend>
        <FormFieldGrid>
          <Field className="sm:col-span-2" data-invalid={!!errors.seo_url || undefined}>
            <FieldLabel htmlFor="hospital-seo-url">
              SEO URL <span className="text-destructive">*</span>
            </FieldLabel>
            <Input id="hospital-seo-url" aria-invalid={!!errors.seo_url || undefined} {...register("seo_url")} />
            <FieldError errors={[errors.seo_url]} />
          </Field>

          <Field data-invalid={!!errors.meta_title || undefined}>
            <FieldLabel htmlFor="hospital-meta-title">
              Meta Title <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="hospital-meta-title" {...register("meta_title")} />
            <FieldError errors={[errors.meta_title]} />
          </Field>

          <Field data-invalid={!!errors.meta_keywords || undefined}>
            <FieldLabel htmlFor="hospital-meta-keywords">
              Meta Keywords <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="hospital-meta-keywords" {...register("meta_keywords")} />
            <FieldError errors={[errors.meta_keywords]} />
          </Field>

          <Field className="sm:col-span-2" data-invalid={!!errors.meta_description || undefined}>
            <FieldLabel htmlFor="hospital-meta-description">
              Meta Description <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Textarea id="hospital-meta-description" rows={3} {...register("meta_description")} />
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
          {mode === "create" ? "Create Hospital" : "Save Changes"}
        </LoadingButton>
      </DialogFooter>
    </form>

    {mode === "edit" && hospitalId !== null && (
      <>
        <HospitalWhyChooseUsDialog
          open={whyChooseUsOpen}
          hospitalId={hospitalId}
          hospitalName={initialHospital?.hospital_name}
          onOpenChange={setWhyChooseUsOpen}
        />
        <HospitalFinalCtaDialog
          open={finalCtaOpen}
          hospitalId={hospitalId}
          hospitalName={initialHospital?.hospital_name}
          onOpenChange={setFinalCtaOpen}
        />
        <HospitalGalleryDialog
          open={galleryOpen}
          hospitalId={hospitalId}
          hospitalName={initialHospital?.hospital_name}
          onOpenChange={setGalleryOpen}
        />
        <HospitalInsuranceDialog
          open={insuranceOpen}
          hospitalId={hospitalId}
          hospitalName={initialHospital?.hospital_name}
          onOpenChange={setInsuranceOpen}
        />
      </>
    )}
    </>
  );
}
