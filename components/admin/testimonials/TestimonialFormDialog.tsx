"use client";

import { useMemo, useState } from "react";
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
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { ApiError } from "@/lib/api/client";
import { createTestimonial, getTestimonial, updateTestimonial } from "@/lib/api/testimonials";
import { listLanguages } from "@/lib/api/languages";
import { listCities } from "@/lib/api/cities";
import { listLocations } from "@/lib/api/locations";
import { listHospitals } from "@/lib/api/hospitals";
import { listDoctors } from "@/lib/api/doctors";
import { listSpecialities } from "@/lib/api/specialities";
import { notify } from "@/lib/toast";
import { specialityOptionsKeys, testimonialsKeys } from "@/components/admin/testimonials/queries";
import { hospitalsKeys } from "@/components/admin/hospitals/queries";
import { doctorsKeys } from "@/components/admin/doctors/queries";
import { citiesKeys } from "@/components/admin/cities/queries";
import { locationsKeys } from "@/components/admin/locations/queries";
import { languagesKeys } from "@/components/admin/languages/queries";
import type { Testimonial } from "@/types/testimonial";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const IMAGE_HINT = "JPG, PNG, WEBP or GIF, up to 5MB";
const NO_LOCATION_VALUE = "none";
const NO_HOSPITAL_VALUE = "none";
const NO_DOCTOR_VALUE = "none";

// Mirrors validators/testimonial.validator.ts's createTestimonialSchema exactly —
// testimonial_image is handled separately as File state below (multipart, not
// part of this JSON-shaped schema).
const testimonialFormSchema = z.object({
  testimonial_name: z.string().trim().min(1, "Testimonial name is required").max(255, "Name is too long"),
  language_id: z.string().min(1, "Language is required"),
  city_id: z.string().min(1, "City is required"),
  location_id: z.string(),
  hospital_id: z.string(),
  doctor_id: z.string(),
  // A real number|null, not the string-sentinel pattern the plain
  // `<Select>`-based fields above use, since `SearchableSelect`'s own
  // value type is already `number | null`.
  speciality_id: z.number().nullable(),
  youtube_url: z.string().trim().max(500, "URL is too long").optional(),
  publish_date: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["active", "inactive"]),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255, "SEO URL is too long"),
  meta_title: z.string().trim().max(255, "Meta title is too long").optional(),
  meta_keywords: z.string().trim().max(500, "Meta keywords is too long").optional(),
  meta_description: z.string().trim().optional(),
});

type TestimonialFormValues = z.infer<typeof testimonialFormSchema>;

type TestimonialFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  testimonialId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function TestimonialFormDialog({ open, mode, testimonialId, onOpenChange }: TestimonialFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add Testimonial" : "Edit Testimonial"}
      description={mode === "create" ? "Create a new testimonial." : "Update this testimonial's details."}
      className="sm:max-w-4xl"
    >
      {open && (
        <TestimonialFormBody
          key={mode === "edit" ? (testimonialId ?? "edit") : "create"}
          mode={mode}
          testimonialId={testimonialId}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function TestimonialFormBody({
  mode,
  testimonialId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  testimonialId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const testimonialQuery = useQuery({
    queryKey: testimonialsKeys.detail(testimonialId ?? -1),
    queryFn: () => getTestimonial(testimonialId as number),
    enabled: mode === "edit" && testimonialId !== null,
  });

  if (mode === "edit" && testimonialQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading testimonial…
      </div>
    );
  }

  if (mode === "edit" && testimonialQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {testimonialQuery.error instanceof ApiError ? testimonialQuery.error.message : "Failed to load testimonial."}
      </p>
    );
  }

  return (
    <TestimonialForm
      mode={mode}
      testimonialId={testimonialId}
      initialTestimonial={testimonialQuery.data?.testimonial}
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

function TestimonialForm({
  mode,
  testimonialId,
  initialTestimonial,
  onOpenChange,
}: {
  mode: "create" | "edit";
  testimonialId: number | null;
  initialTestimonial?: Testimonial;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const languagesQuery = useQuery({ queryKey: languagesKeys.all, queryFn: listLanguages });
  const citiesQuery = useQuery({ queryKey: citiesKeys.all, queryFn: listCities });
  const locationsQuery = useQuery({ queryKey: locationsKeys.all, queryFn: listLocations });
  const hospitalsQuery = useQuery({ queryKey: hospitalsKeys.all, queryFn: () => listHospitals() });
  const doctorsQuery = useQuery({ queryKey: doctorsKeys.all, queryFn: () => listDoctors() });
  const specialitiesQuery = useQuery({
    queryKey: specialityOptionsKeys.active,
    queryFn: () => listSpecialities({ status: "active" }),
  });

  const languages = languagesQuery.data?.languages ?? [];
  const cities = citiesQuery.data?.cities ?? [];
  const allLocations = useMemo(() => locationsQuery.data?.locations ?? [], [locationsQuery.data]);
  const hospitals = hospitalsQuery.data?.hospitals ?? [];
  const doctors = doctorsQuery.data?.doctors ?? [];
  const specialityOptions = useMemo(
    () =>
      (specialitiesQuery.data?.specialities ?? []).map((speciality) => ({
        value: speciality.id,
        label: `${speciality.speciality_title?.trim() || speciality.speciality_name} — ${speciality.city.city_name}`,
      })),
    [specialitiesQuery.data]
  );

  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TestimonialFormValues>({
    resolver: zodResolver(testimonialFormSchema),
    defaultValues: {
      testimonial_name: initialTestimonial?.testimonial_name ?? "",
      language_id: initialTestimonial ? String(initialTestimonial.language_id) : "",
      city_id: initialTestimonial ? String(initialTestimonial.city_id) : "",
      location_id: initialTestimonial?.location_id ? String(initialTestimonial.location_id) : NO_LOCATION_VALUE,
      hospital_id: initialTestimonial?.hospital_id ? String(initialTestimonial.hospital_id) : NO_HOSPITAL_VALUE,
      doctor_id: initialTestimonial?.doctor_id ? String(initialTestimonial.doctor_id) : NO_DOCTOR_VALUE,
      speciality_id: initialTestimonial?.speciality_id ?? null,
      youtube_url: initialTestimonial?.youtube_url ?? "",
      publish_date: toDateInputValue(initialTestimonial?.publish_date),
      description: initialTestimonial?.description ?? "",
      status: initialTestimonial?.status === "inactive" ? "inactive" : "active",
      seo_url: initialTestimonial?.seo_url ?? "",
      meta_title: initialTestimonial?.meta_title ?? "",
      meta_keywords: initialTestimonial?.meta_keywords ?? "",
      meta_description: initialTestimonial?.meta_description ?? "",
    },
  });

  const selectedCityId = watch("city_id");

  const locationOptions = useMemo(
    () => allLocations.filter((location) => String(location.city_id) === selectedCityId),
    [allLocations, selectedCityId]
  );

  const mutation = useMutation({
    mutationFn: async (values: TestimonialFormValues) => {
      const payload = {
        testimonial_name: values.testimonial_name,
        language_id: Number(values.language_id),
        city_id: Number(values.city_id),
        location_id: values.location_id === NO_LOCATION_VALUE ? null : Number(values.location_id),
        hospital_id: values.hospital_id === NO_HOSPITAL_VALUE ? null : Number(values.hospital_id),
        doctor_id: values.doctor_id === NO_DOCTOR_VALUE ? null : Number(values.doctor_id),
        speciality_id: values.speciality_id,
        youtube_url: values.youtube_url ? values.youtube_url : null,
        publish_date: values.publish_date ? values.publish_date : null,
        description: values.description ? values.description : null,
        status: values.status,
        seo_url: values.seo_url,
        meta_title: values.meta_title ? values.meta_title : null,
        meta_keywords: values.meta_keywords ? values.meta_keywords : null,
        meta_description: values.meta_description ? values.meta_description : null,
      };
      if (mode === "create") {
        return createTestimonial(payload, imageFiles[0]);
      }
      return updateTestimonial(testimonialId as number, payload, imageFiles[0]);
    },
    onSuccess: () => {
      notify.success(mode === "create" ? "Testimonial created successfully." : "Testimonial updated successfully.");
      queryClient.invalidateQueries({ queryKey: testimonialsKeys.all });
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: TestimonialFormValues) => {
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
          Testimonial Information
        </FieldLegend>
        <FormFieldGrid>
          <Field className="sm:col-span-2" data-invalid={!!errors.testimonial_name || undefined}>
            <FieldLabel htmlFor="testimonial-name">
              Testimonial Name <span className="text-destructive">*</span>
            </FieldLabel>
            <Input id="testimonial-name" aria-invalid={!!errors.testimonial_name || undefined} {...register("testimonial_name")} />
            <FieldError errors={[errors.testimonial_name]} />
          </Field>

          <Field data-invalid={!!errors.language_id || undefined}>
            <FieldLabel htmlFor="testimonial-language">
              Language <span className="text-destructive">*</span>
            </FieldLabel>
            <Controller
              name="language_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={languagesQuery.isLoading}>
                  <SelectTrigger id="testimonial-language" className="w-full">
                    <SelectValue placeholder={languagesQuery.isLoading ? "Loading…" : "Select a language"} />
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

          <Field data-invalid={!!errors.city_id || undefined}>
            <FieldLabel htmlFor="testimonial-city">
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
                  <SelectTrigger id="testimonial-city" className="w-full">
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
            <FieldLabel htmlFor="testimonial-location">Location</FieldLabel>
            <Controller
              name="location_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!selectedCityId}>
                  <SelectTrigger id="testimonial-location" className="w-full">
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

          <Field data-invalid={!!errors.hospital_id || undefined}>
            <FieldLabel htmlFor="testimonial-hospital">
              Hospital <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Controller
              name="hospital_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={hospitalsQuery.isLoading}>
                  <SelectTrigger id="testimonial-hospital" className="w-full">
                    <SelectValue placeholder={hospitalsQuery.isLoading ? "Loading…" : "Select a hospital"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_HOSPITAL_VALUE}>None</SelectItem>
                    {hospitals.map((hospital) => (
                      <SelectItem key={hospital.id} value={String(hospital.id)}>
                        {hospital.hospital_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.hospital_id]} />
          </Field>

          <Field data-invalid={!!errors.doctor_id || undefined}>
            <FieldLabel htmlFor="testimonial-doctor">
              Doctor <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Controller
              name="doctor_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={doctorsQuery.isLoading}>
                  <SelectTrigger id="testimonial-doctor" className="w-full">
                    <SelectValue placeholder={doctorsQuery.isLoading ? "Loading…" : "Select a doctor"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_DOCTOR_VALUE}>None</SelectItem>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={String(doctor.id)}>
                        {doctor.doctor_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.doctor_id]} />
          </Field>

          <Field className="sm:col-span-2" data-invalid={!!errors.speciality_id || undefined}>
            <FieldLabel htmlFor="testimonial-speciality">
              Speciality <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Controller
              name="speciality_id"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  options={specialityOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Search and select a speciality..."
                  searchPlaceholder="Search specialities..."
                  loading={specialitiesQuery.isLoading}
                  emptyText={specialitiesQuery.isError ? "Failed to load specialities." : "No specialities found."}
                />
              )}
            />
            <FieldError errors={[errors.speciality_id]} />
          </Field>

          <Field data-invalid={!!errors.publish_date || undefined}>
            <FieldLabel htmlFor="testimonial-publish-date">
              Publish Date <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="testimonial-publish-date" type="date" {...register("publish_date")} />
            <FieldError errors={[errors.publish_date]} />
          </Field>

          <Field data-invalid={!!errors.status || undefined}>
            <FieldLabel htmlFor="testimonial-status">Status</FieldLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="testimonial-status" className="w-full">
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

          <Field className="sm:col-span-2" data-invalid={!!errors.youtube_url || undefined}>
            <FieldLabel htmlFor="testimonial-youtube-url">
              YouTube URL <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="testimonial-youtube-url" placeholder="https://…" {...register("youtube_url")} />
            <FieldError errors={[errors.youtube_url]} />
          </Field>

          <Field className="sm:col-span-2">
            <FieldLabel>
              Testimonial Image <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            {mode === "edit" && initialTestimonial?.testimonial_image && imageFiles.length === 0 && (
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- small preview of the currently stored image. */}
                <img
                  src={initialTestimonial.testimonial_image}
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
          <Field className="sm:col-span-2" data-invalid={!!errors.description || undefined}>
            <FieldLabel htmlFor="testimonial-description">
              Description <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  id="testimonial-description"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Start writing the testimonial content..."
                  error={!!errors.description}
                />
              )}
            />
            <FieldError errors={[errors.description]} />
          </Field>
        </FormFieldGrid>
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
          SEO
        </FieldLegend>
        <FormFieldGrid>
          <Field className="sm:col-span-2" data-invalid={!!errors.seo_url || undefined}>
            <FieldLabel htmlFor="testimonial-seo-url">
              SEO URL <span className="text-destructive">*</span>
            </FieldLabel>
            <Input id="testimonial-seo-url" aria-invalid={!!errors.seo_url || undefined} {...register("seo_url")} />
            <FieldError errors={[errors.seo_url]} />
          </Field>

          <Field data-invalid={!!errors.meta_title || undefined}>
            <FieldLabel htmlFor="testimonial-meta-title">
              Meta Title <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="testimonial-meta-title" {...register("meta_title")} />
            <FieldError errors={[errors.meta_title]} />
          </Field>

          <Field data-invalid={!!errors.meta_keywords || undefined}>
            <FieldLabel htmlFor="testimonial-meta-keywords">
              Meta Keywords <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="testimonial-meta-keywords" {...register("meta_keywords")} />
            <FieldError errors={[errors.meta_keywords]} />
          </Field>

          <Field className="sm:col-span-2" data-invalid={!!errors.meta_description || undefined}>
            <FieldLabel htmlFor="testimonial-meta-description">
              Meta Description <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Textarea id="testimonial-meta-description" rows={3} {...register("meta_description")} />
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
          {mode === "create" ? "Create Testimonial" : "Save Changes"}
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
