"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { SearchableMultiSelect } from "@/components/admin/SearchableMultiSelect";
import { ApiError } from "@/lib/api/client";
import { createDoctor, getDoctor, updateDoctor } from "@/lib/api/doctors";
import {
  getDoctorHospitals,
  getDoctorSpecialityMappings,
  syncDoctorHospitals,
  syncDoctorSpecialityMappings,
} from "@/lib/api/doctor-mappings";
import { listDoctorSpecialities } from "@/lib/api/doctor-specialities";
import { listHospitals } from "@/lib/api/hospitals";
import { listLanguages } from "@/lib/api/languages";
import { listCities } from "@/lib/api/cities";
import { listLocations } from "@/lib/api/locations";
import { createDoctorAward, deleteDoctorAward, listDoctorAwards, updateDoctorAward } from "@/lib/api/doctor-awards";
import { createDoctorFaq, deleteDoctorFaq, listDoctorFaqs, updateDoctorFaq } from "@/lib/api/doctor-faqs";
import { notify } from "@/lib/toast";
import {
  doctorAwardsKeys,
  doctorFaqsKeys,
  doctorHospitalMappingKeys,
  doctorHospitalOptionsKeys,
  doctorsKeys,
  doctorSpecialityMappingKeys,
  doctorSpecialityOptionsKeys,
} from "@/components/admin/doctors/queries";
import { citiesKeys } from "@/components/admin/cities/queries";
import { locationsKeys } from "@/components/admin/locations/queries";
import { languagesKeys } from "@/components/admin/languages/queries";
import type { Doctor } from "@/types/doctor";
import type { DoctorAward } from "@/types/doctor-award";
import type { DoctorFaq } from "@/types/doctor-faq";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const IMAGE_HINT = "JPG, PNG, WEBP or GIF, up to 5MB · Recommended: 1200 × 900 px (4:3)";
const NO_LOCATION_VALUE = "none";
const decimalPattern = /^-?\d+(\.\d+)?$/;

// Mirrors validators/doctor.validator.ts's createDoctorSchema exactly —
// `doctor_image` is handled separately as File state below (multipart, not
// part of this JSON-shaped schema) and `schema_tags` is deliberately
// omitted entirely: it's an untyped Json column the validator itself
// documents as "intentionally left opaque/untouched, per project
// convention", so no editor is invented for it here.
const doctorFormSchema = z.object({
  doctor_name: z.string().trim().min(1, "Doctor name is required").max(255, "Name is too long"),
  language_id: z.string().min(1, "Language is required"),
  city_id: z.string().min(1, "City is required"),
  location_id: z.string(),
  qualification: z.string().trim().optional(),
  experience: z.string().trim().optional(),
  availability: z.string().trim().optional(),
  patient_satisfaction_score: z
    .string()
    .trim()
    .refine((v) => v === "" || decimalPattern.test(v), "Enter a valid number")
    .optional(),
  sorting_order: z.string().trim().refine((v) => v === "" || /^-?\d+$/.test(v), "Enter a whole number"),
  mon_sat_first_timings: z.string().trim().optional(),
  mon_sat_second_timings: z.string().trim().optional(),
  sunday_timings: z.string().trim().optional(),
  time_interval: z.string().trim().optional(),
  location_map: z.string().trim().optional(),
  doctor_description: z.string().trim().optional(),
  ai_content_generator: z.boolean(),
  doc_info: z.string().optional(),
  latitude: z.string().trim().refine((v) => v === "" || decimalPattern.test(v), "Enter a valid number").optional(),
  longitude: z.string().trim().refine((v) => v === "" || decimalPattern.test(v), "Enter a valid number").optional(),
  status: z.enum(["active", "inactive"]),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255, "SEO URL is too long"),
  meta_title: z.string().trim().max(255, "Meta title is too long").optional(),
  meta_keywords: z.string().trim().max(500, "Meta keywords is too long").optional(),
  meta_description: z.string().trim().optional(),
  awards: z.array(
    z.object({
      // Not named `id` — react-hook-form's `useFieldArray` injects its own
      // `id` onto every field item for list rendering, which would shadow
      // (and be shadowed by) a same-named real database id. `dbId` is the
      // real `doctor_awards.id` for an existing award, `undefined` for one
      // just added in this session (not yet persisted).
      dbId: z.number().optional(),
      title: z.string().trim().min(1, "Award title is required").max(255, "Title is too long"),
      organization: z.string().trim().max(255, "Organisation is too long").optional(),
      award_year: z.string().trim().max(50, "Year is too long").optional(),
      description: z.string().trim().optional(),
    })
  ),
  faqs: z.array(
    z.object({
      dbId: z.number().optional(),
      title: z.string().trim().min(1, "Question is required").max(255, "Question is too long"),
      text: z.string().trim().min(1, "Answer is required"),
    })
  ),
});

type DoctorFormValues = z.infer<typeof doctorFormSchema>;

type DoctorFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  doctorId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function DoctorFormDialog({ open, mode, doctorId, onOpenChange }: DoctorFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add Doctor" : "Edit Doctor"}
      description={mode === "create" ? "Create a new doctor." : "Update this doctor's details."}
      className="sm:max-w-4xl"
    >
      {open && (
        <DoctorFormBody
          key={mode === "edit" ? (doctorId ?? "edit") : "create"}
          mode={mode}
          doctorId={doctorId}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function DoctorFormBody({
  mode,
  doctorId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  doctorId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const doctorQuery = useQuery({
    queryKey: doctorsKeys.detail(doctorId ?? -1),
    queryFn: () => getDoctor(doctorId as number),
    enabled: mode === "edit" && doctorId !== null,
  });

  // Awards/FAQs are fetched here (alongside the doctor itself) rather than
  // lazily inside DoctorForm, so their existing values can go straight into
  // useForm's synchronous `defaultValues` the same way `initialDoctor` does
  // — and so a failed fetch blocks the form entirely instead of silently
  // defaulting to an empty list, which the save reconciliation below would
  // otherwise read as "the admin removed everything."
  const awardsQuery = useQuery({
    queryKey: doctorAwardsKeys.byDoctor(doctorId ?? -1),
    queryFn: () => listDoctorAwards(doctorId as number),
    enabled: mode === "edit" && doctorId !== null,
  });
  const faqsQuery = useQuery({
    queryKey: doctorFaqsKeys.byDoctor(doctorId ?? -1),
    queryFn: () => listDoctorFaqs(doctorId as number),
    enabled: mode === "edit" && doctorId !== null,
  });

  if (mode === "edit" && (doctorQuery.isLoading || awardsQuery.isLoading || faqsQuery.isLoading)) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading doctor…
      </div>
    );
  }

  if (mode === "edit" && (doctorQuery.isError || awardsQuery.isError || faqsQuery.isError)) {
    const firstError = [doctorQuery.error, awardsQuery.error, faqsQuery.error].find(
      (error): error is ApiError => error instanceof ApiError
    );
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {firstError ? firstError.message : "Failed to load doctor."}
      </p>
    );
  }

  return (
    <DoctorForm
      mode={mode}
      doctorId={doctorId}
      initialDoctor={doctorQuery.data?.doctor}
      initialAwards={awardsQuery.data?.doctorAwards.filter((award) => award.status === "active")}
      initialFaqs={faqsQuery.data?.doctorFaqs.filter((faq) => faq.status === "active")}
      onOpenChange={onOpenChange}
    />
  );
}

function DoctorForm({
  mode,
  doctorId,
  initialDoctor,
  initialAwards,
  initialFaqs,
  onOpenChange,
}: {
  mode: "create" | "edit";
  doctorId: number | null;
  initialDoctor?: Doctor;
  initialAwards?: DoctorAward[];
  initialFaqs?: DoctorFaq[];
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const languagesQuery = useQuery({ queryKey: languagesKeys.all, queryFn: listLanguages });
  const citiesQuery = useQuery({ queryKey: citiesKeys.all, queryFn: listCities });
  const locationsQuery = useQuery({ queryKey: locationsKeys.all, queryFn: listLocations });

  const languages = languagesQuery.data?.languages ?? [];
  const cities = citiesQuery.data?.cities ?? [];
  const allLocations = useMemo(() => locationsQuery.data?.locations ?? [], [locationsQuery.data]);

  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      doctor_name: initialDoctor?.doctor_name ?? "",
      language_id: initialDoctor ? String(initialDoctor.language_id) : "",
      city_id: initialDoctor ? String(initialDoctor.city_id) : "",
      location_id: initialDoctor?.location_id ? String(initialDoctor.location_id) : NO_LOCATION_VALUE,
      qualification: initialDoctor?.qualification ?? "",
      experience: initialDoctor?.experience ?? "",
      availability: initialDoctor?.availability ?? "",
      patient_satisfaction_score: initialDoctor?.patient_satisfaction_score ?? "",
      sorting_order: initialDoctor ? String(initialDoctor.sorting_order) : "0",
      mon_sat_first_timings: initialDoctor?.mon_sat_first_timings ?? "",
      mon_sat_second_timings: initialDoctor?.mon_sat_second_timings ?? "",
      sunday_timings: initialDoctor?.sunday_timings ?? "",
      time_interval: initialDoctor?.time_interval ?? "",
      location_map: initialDoctor?.location_map ?? "",
      doctor_description: initialDoctor?.doctor_description ?? "",
      ai_content_generator: initialDoctor?.ai_content_generator ?? false,
      doc_info: initialDoctor?.doc_info ?? "",
      latitude: initialDoctor?.latitude ?? "",
      longitude: initialDoctor?.longitude ?? "",
      status: initialDoctor?.status === "inactive" ? "inactive" : "active",
      seo_url: initialDoctor?.seo_url ?? "",
      meta_title: initialDoctor?.meta_title ?? "",
      meta_keywords: initialDoctor?.meta_keywords ?? "",
      meta_description: initialDoctor?.meta_description ?? "",
      awards: (initialAwards ?? []).map((award) => ({
        dbId: award.id,
        title: award.title,
        organization: award.organization ?? "",
        award_year: award.award_year ?? "",
        description: award.description ?? "",
      })),
      faqs: (initialFaqs ?? []).map((faq) => ({ dbId: faq.id, title: faq.title, text: faq.text })),
    },
  });

  const awardsFieldArray = useFieldArray({ control, name: "awards" });
  const faqsFieldArray = useFieldArray({ control, name: "faqs" });

  const selectedCityId = watch("city_id");
  const selectedCityIdNum = selectedCityId ? Number(selectedCityId) : null;

  const locationOptions = useMemo(
    () => allLocations.filter((location) => String(location.city_id) === selectedCityId),
    [allLocations, selectedCityId]
  );

  // Options are always filtered to `status: "active"` (never city-scoped —
  // doctor_specialities is a nationwide catalog, not per-city) and use their
  // own query key (doctorSpecialityOptionsKeys.active), not `.all`, since
  // `.all` is the unfiltered cache shared with the Manage Specialities
  // picker/admin table — filtering it here would corrupt that shared entry.
  const specialityOptionsQuery = useQuery({
    queryKey: doctorSpecialityOptionsKeys.active,
    queryFn: () => listDoctorSpecialities({ status: "active" }),
  });
  const specialityMappingsQuery = useQuery({
    queryKey: doctorSpecialityMappingKeys.byDoctor(doctorId ?? -1),
    queryFn: () => getDoctorSpecialityMappings(doctorId as number),
    enabled: mode === "edit" && doctorId !== null,
  });

  // Hospitals ARE city-scoped: options only ever include active hospitals
  // belonging to the doctor's currently selected city, refetched whenever
  // `selectedCityIdNum` changes since it's part of the query key.
  const hospitalOptionsQuery = useQuery({
    queryKey: doctorHospitalOptionsKeys.byCity(selectedCityIdNum ?? -1),
    queryFn: () => listHospitals({ city_id: selectedCityIdNum as number, status: "active" }),
    enabled: selectedCityIdNum !== null,
  });
  const hospitalMappingsQuery = useQuery({
    queryKey: doctorHospitalMappingKeys.byDoctor(doctorId ?? -1),
    queryFn: () => getDoctorHospitals(doctorId as number),
    enabled: mode === "edit" && doctorId !== null,
  });

  const specialityOptions = useMemo(
    () =>
      (specialityOptionsQuery.data?.doctorSpecialities ?? []).map((s) => ({
        value: s.id,
        label: s.speciality_name,
      })),
    [specialityOptionsQuery.data]
  );
  const hospitalOptions = useMemo(
    () =>
      (hospitalOptionsQuery.data?.hospitals ?? []).map((h) => ({
        value: h.id,
        label: h.hospital_name,
      })),
    [hospitalOptionsQuery.data]
  );

  const [selectedSpecialityIds, setSelectedSpecialityIds] = useState<number[]>([]);
  const [specialitiesInitialized, setSpecialitiesInitialized] = useState(false);
  const [selectedHospitalIds, setSelectedHospitalIds] = useState<number[]>([]);
  const [hospitalsInitialized, setHospitalsInitialized] = useState(false);

  // Preselects the doctor's existing mappings exactly once, the same
  // "initialized" guard DoctorSpecialitiesMappingDialog uses — create mode
  // simply keeps the empty array from useState above.
  if (mode === "edit" && !specialitiesInitialized && specialityMappingsQuery.data) {
    setSelectedSpecialityIds(specialityMappingsQuery.data.doctorSpecialities.map((s) => s.id));
    setSpecialitiesInitialized(true);
  }
  if (mode === "edit" && !hospitalsInitialized && hospitalMappingsQuery.data) {
    setSelectedHospitalIds(hospitalMappingsQuery.data.hospitals.map((h) => h.id));
    setHospitalsInitialized(true);
  }

  const mutation = useMutation({
    mutationFn: async (values: DoctorFormValues) => {
      const payload = {
        doctor_name: values.doctor_name,
        language_id: Number(values.language_id),
        city_id: Number(values.city_id),
        location_id: values.location_id === NO_LOCATION_VALUE ? null : Number(values.location_id),
        qualification: values.qualification ? values.qualification : null,
        experience: values.experience ? values.experience : null,
        availability: values.availability ? values.availability : null,
        patient_satisfaction_score: values.patient_satisfaction_score ? values.patient_satisfaction_score : null,
        sorting_order: values.sorting_order === "" ? 0 : Number(values.sorting_order),
        mon_sat_first_timings: values.mon_sat_first_timings ? values.mon_sat_first_timings : null,
        mon_sat_second_timings: values.mon_sat_second_timings ? values.mon_sat_second_timings : null,
        sunday_timings: values.sunday_timings ? values.sunday_timings : null,
        time_interval: values.time_interval ? values.time_interval : null,
        location_map: values.location_map ? values.location_map : null,
        doctor_description: values.doctor_description ? values.doctor_description : null,
        ai_content_generator: values.ai_content_generator,
        doc_info: values.doc_info ? values.doc_info : null,
        latitude: values.latitude ? values.latitude : null,
        longitude: values.longitude ? values.longitude : null,
        status: values.status,
        seo_url: values.seo_url,
        meta_title: values.meta_title ? values.meta_title : null,
        meta_keywords: values.meta_keywords ? values.meta_keywords : null,
        meta_description: values.meta_description ? values.meta_description : null,
      };
      const result =
        mode === "create"
          ? await createDoctor(payload, imageFiles[0])
          : await updateDoctor(doctorId as number, payload, imageFiles[0]);

      // Syncs through the same full-replace mapping services used by the
      // separate Manage Specialities/Manage Hospitals dialogs — for a new
      // doctor this is the id the API just assigned, not doctorId (which is
      // null in create mode). Awaited sequentially and not wrapped in a
      // try/catch: a failure here throws out of mutationFn, so useMutation's
      // onError fires and onSuccess never does — no false "success" toast
      // if the doctor saved but a mapping sync failed.
      await syncDoctorSpecialityMappings(result.doctor.id, selectedSpecialityIds);
      await syncDoctorHospitals(result.doctor.id, selectedHospitalIds);

      // Awards/FAQs reconciliation — same "just re-apply the current form
      // state" convention as the mapping syncs above, not a change-only
      // diff: every item still present gets an update call (even if its
      // fields didn't change), every item without a `dbId` gets created,
      // and every originally-loaded id no longer present gets deleted.
      // Leaving the section untouched reproduces the original list
      // unchanged, so nothing is ever deleted just by saving the form.
      const originalAwardIds = (initialAwards ?? []).map((award) => award.id);
      const currentAwardDbIds = values.awards
        .map((award) => award.dbId)
        .filter((dbId): dbId is number => dbId !== undefined);
      const removedAwardIds = originalAwardIds.filter((id) => !currentAwardDbIds.includes(id));

      for (const award of values.awards) {
        const payload = {
          doctor_id: result.doctor.id,
          title: award.title,
          organization: award.organization ? award.organization : null,
          award_year: award.award_year ? award.award_year : null,
          description: award.description ? award.description : null,
        };
        if (award.dbId !== undefined) {
          await updateDoctorAward(award.dbId, payload);
        } else {
          await createDoctorAward(payload);
        }
      }
      for (const id of removedAwardIds) {
        await deleteDoctorAward(id);
      }

      const originalFaqIds = (initialFaqs ?? []).map((faq) => faq.id);
      const currentFaqDbIds = values.faqs.map((faq) => faq.dbId).filter((dbId): dbId is number => dbId !== undefined);
      const removedFaqIds = originalFaqIds.filter((id) => !currentFaqDbIds.includes(id));

      for (const faq of values.faqs) {
        const payload = { doctor_id: result.doctor.id, title: faq.title, text: faq.text };
        if (faq.dbId !== undefined) {
          await updateDoctorFaq(faq.dbId, payload);
        } else {
          await createDoctorFaq(payload);
        }
      }
      for (const id of removedFaqIds) {
        await deleteDoctorFaq(id);
      }

      return result;
    },
    onSuccess: (result) => {
      notify.success(mode === "create" ? "Doctor created successfully." : "Doctor updated successfully.");
      queryClient.invalidateQueries({ queryKey: doctorsKeys.all });
      queryClient.invalidateQueries({ queryKey: doctorSpecialityMappingKeys.byDoctor(result.doctor.id) });
      queryClient.invalidateQueries({ queryKey: doctorHospitalMappingKeys.byDoctor(result.doctor.id) });
      queryClient.invalidateQueries({ queryKey: doctorAwardsKeys.byDoctor(result.doctor.id) });
      queryClient.invalidateQueries({ queryKey: doctorFaqsKeys.byDoctor(result.doctor.id) });
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: DoctorFormValues) => {
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
          Doctor Information
        </FieldLegend>
        <FormFieldGrid>
          <Field className="sm:col-span-2" data-invalid={!!errors.doctor_name || undefined}>
            <FieldLabel htmlFor="doctor-name">
              Doctor Name <span className="text-destructive">*</span>
            </FieldLabel>
            <Input id="doctor-name" aria-invalid={!!errors.doctor_name || undefined} {...register("doctor_name")} />
            <FieldError errors={[errors.doctor_name]} />
          </Field>

          <Field data-invalid={!!errors.qualification || undefined}>
            <FieldLabel htmlFor="doctor-qualification">
              Qualification <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="doctor-qualification" {...register("qualification")} />
            <FieldError errors={[errors.qualification]} />
          </Field>

          <Field data-invalid={!!errors.experience || undefined}>
            <FieldLabel htmlFor="doctor-experience">
              Experience <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="doctor-experience" {...register("experience")} />
            <FieldError errors={[errors.experience]} />
          </Field>

          <Field data-invalid={!!errors.language_id || undefined}>
            <FieldLabel htmlFor="doctor-language">
              Language <span className="text-destructive">*</span>
            </FieldLabel>
            <Controller
              name="language_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={languagesQuery.isLoading}>
                  <SelectTrigger id="doctor-language" className="w-full">
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
            <FieldLabel htmlFor="doctor-city">
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
                    // Hospitals are strictly city-scoped (the picker only ever
                    // offers hospitals belonging to the currently selected
                    // city), so every currently selected hospital belonged to
                    // the OLD city and none can belong to the new one —
                    // clearing the full selection is exactly "remove hospitals
                    // that no longer belong to the selected city", the same
                    // reasoning already applied to location_id above.
                    setSelectedHospitalIds([]);
                  }}
                  disabled={citiesQuery.isLoading}
                >
                  <SelectTrigger id="doctor-city" className="w-full">
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
            <FieldLabel htmlFor="doctor-location">Location</FieldLabel>
            <Controller
              name="location_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!selectedCityId}>
                  <SelectTrigger id="doctor-location" className="w-full">
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

          <Field className="sm:col-span-2">
            <FieldLabel>
              Doctor Specialities <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <SearchableMultiSelect
              options={specialityOptions}
              selected={selectedSpecialityIds}
              onChange={setSelectedSpecialityIds}
              placeholder="Search and select doctor specialities..."
              searchPlaceholder="Search doctor specialities..."
              loading={specialityOptionsQuery.isLoading || (mode === "edit" && specialityMappingsQuery.isLoading)}
              emptyText={specialityOptionsQuery.isError ? "Failed to load doctor specialities." : "No doctor specialities found."}
            />
          </Field>

          <Field className="sm:col-span-2">
            <FieldLabel>
              Hospitals <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <SearchableMultiSelect
              options={hospitalOptions}
              selected={selectedHospitalIds}
              onChange={setSelectedHospitalIds}
              placeholder="Search and select hospitals..."
              searchPlaceholder="Search hospitals..."
              disabled={!selectedCityIdNum}
              loading={
                selectedCityIdNum !== null &&
                (hospitalOptionsQuery.isLoading || (mode === "edit" && hospitalMappingsQuery.isLoading))
              }
              emptyText={
                !selectedCityIdNum
                  ? "Select a city first."
                  : hospitalOptionsQuery.isError
                    ? "Failed to load hospitals."
                    : "No active hospitals found for this city."
              }
            />
          </Field>

          <Field data-invalid={!!errors.availability || undefined}>
            <FieldLabel htmlFor="doctor-availability">
              Availability <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="doctor-availability" {...register("availability")} />
            <FieldError errors={[errors.availability]} />
          </Field>

          <Field data-invalid={!!errors.status || undefined}>
            <FieldLabel htmlFor="doctor-status">Status</FieldLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="doctor-status" className="w-full">
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

          <Field data-invalid={!!errors.patient_satisfaction_score || undefined}>
            <FieldLabel htmlFor="doctor-satisfaction-score">
              Patient Satisfaction Score <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="doctor-satisfaction-score" type="number" step="0.01" {...register("patient_satisfaction_score")} />
            <FieldError errors={[errors.patient_satisfaction_score]} />
          </Field>

          <Field data-invalid={!!errors.sorting_order || undefined}>
            <FieldLabel htmlFor="doctor-sorting-order">Sorting Order</FieldLabel>
            <Input
              id="doctor-sorting-order"
              type="number"
              step="1"
              aria-invalid={!!errors.sorting_order || undefined}
              {...register("sorting_order")}
            />
            <FieldError errors={[errors.sorting_order]} />
          </Field>

          <Field data-invalid={!!errors.mon_sat_first_timings || undefined}>
            <FieldLabel htmlFor="doctor-mon-sat-first-timings">
              Mon–Sat First Timings <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="doctor-mon-sat-first-timings" {...register("mon_sat_first_timings")} />
            <FieldError errors={[errors.mon_sat_first_timings]} />
          </Field>

          <Field data-invalid={!!errors.mon_sat_second_timings || undefined}>
            <FieldLabel htmlFor="doctor-mon-sat-second-timings">
              Mon–Sat Second Timings <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="doctor-mon-sat-second-timings" {...register("mon_sat_second_timings")} />
            <FieldError errors={[errors.mon_sat_second_timings]} />
          </Field>

          <Field data-invalid={!!errors.sunday_timings || undefined}>
            <FieldLabel htmlFor="doctor-sunday-timings">
              Sunday Timings <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="doctor-sunday-timings" {...register("sunday_timings")} />
            <FieldError errors={[errors.sunday_timings]} />
          </Field>

          <Field data-invalid={!!errors.time_interval || undefined}>
            <FieldLabel htmlFor="doctor-time-interval">
              Time Interval <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="doctor-time-interval" {...register("time_interval")} />
            <FieldError errors={[errors.time_interval]} />
          </Field>

          <Field data-invalid={!!errors.latitude || undefined}>
            <FieldLabel htmlFor="doctor-latitude">
              Latitude <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="doctor-latitude" type="number" step="0.000001" {...register("latitude")} />
            <FieldError errors={[errors.latitude]} />
          </Field>

          <Field data-invalid={!!errors.longitude || undefined}>
            <FieldLabel htmlFor="doctor-longitude">
              Longitude <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="doctor-longitude" type="number" step="0.000001" {...register("longitude")} />
            <FieldError errors={[errors.longitude]} />
          </Field>

          <Field className="sm:col-span-2">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3">
              <div>
                <FieldLabel htmlFor="doctor-ai-content-generator">AI Content Generator</FieldLabel>
                <p className="text-helper">Marks this doctor as eligible for AI-assisted content generation.</p>
              </div>
              <Controller
                name="ai_content_generator"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="doctor-ai-content-generator"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </Field>

          <Field className="sm:col-span-2">
            <FieldLabel>
              Doctor Image <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            {mode === "edit" && initialDoctor?.doctor_image && imageFiles.length === 0 && (
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- small preview of the currently stored image. */}
                <img
                  src={initialDoctor.doctor_image}
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
          <Field className="sm:col-span-2" data-invalid={!!errors.location_map || undefined}>
            <FieldLabel htmlFor="doctor-location-map">
              Location Map <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Textarea id="doctor-location-map" rows={2} {...register("location_map")} />
            <FieldError errors={[errors.location_map]} />
          </Field>

          <Field className="sm:col-span-2" data-invalid={!!errors.doctor_description || undefined}>
            <FieldLabel htmlFor="doctor-description">
              Short Description <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Textarea id="doctor-description" rows={3} {...register("doctor_description")} />
            <FieldError errors={[errors.doctor_description]} />
          </Field>

          <Field className="sm:col-span-2" data-invalid={!!errors.doc_info || undefined}>
            <FieldLabel htmlFor="doctor-doc-info">
              Doctor Info <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Controller
              name="doc_info"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  id="doctor-doc-info"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Start writing the content for this doctor..."
                  error={!!errors.doc_info}
                />
              )}
            />
            <FieldError errors={[errors.doc_info]} />
          </Field>
        </FormFieldGrid>
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
          Awards &amp; Recognitions
        </FieldLegend>
        <div className="flex flex-col gap-3">
          {awardsFieldArray.fields.length === 0 ? (
            <p className="text-body-sm text-muted-foreground">No awards added yet.</p>
          ) : (
            awardsFieldArray.fields.map((field, index) => (
              <div key={field.id} className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3">
                <FormFieldGrid>
                  <Field className="sm:col-span-2" data-invalid={!!errors.awards?.[index]?.title || undefined}>
                    <FieldLabel htmlFor={`doctor-award-title-${index}`}>
                      Award Title <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id={`doctor-award-title-${index}`}
                      aria-invalid={!!errors.awards?.[index]?.title || undefined}
                      {...register(`awards.${index}.title` as const)}
                    />
                    <FieldError errors={[errors.awards?.[index]?.title]} />
                  </Field>

                  <Field data-invalid={!!errors.awards?.[index]?.organization || undefined}>
                    <FieldLabel htmlFor={`doctor-award-organization-${index}`}>
                      Issuing Organisation <span className="text-muted-foreground">(optional)</span>
                    </FieldLabel>
                    <Input id={`doctor-award-organization-${index}`} {...register(`awards.${index}.organization` as const)} />
                    <FieldError errors={[errors.awards?.[index]?.organization]} />
                  </Field>

                  <Field data-invalid={!!errors.awards?.[index]?.award_year || undefined}>
                    <FieldLabel htmlFor={`doctor-award-year-${index}`}>
                      Year / Date <span className="text-muted-foreground">(optional)</span>
                    </FieldLabel>
                    <Input
                      id={`doctor-award-year-${index}`}
                      placeholder="e.g. 2023"
                      {...register(`awards.${index}.award_year` as const)}
                    />
                    <FieldError errors={[errors.awards?.[index]?.award_year]} />
                  </Field>

                  <Field className="sm:col-span-2" data-invalid={!!errors.awards?.[index]?.description || undefined}>
                    <FieldLabel htmlFor={`doctor-award-description-${index}`}>
                      Description <span className="text-muted-foreground">(optional)</span>
                    </FieldLabel>
                    <Textarea
                      id={`doctor-award-description-${index}`}
                      rows={2}
                      {...register(`awards.${index}.description` as const)}
                    />
                    <FieldError errors={[errors.awards?.[index]?.description]} />
                  </Field>
                </FormFieldGrid>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-fit text-destructive hover:text-destructive"
                  onClick={() => awardsFieldArray.remove(index)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Remove Award
                </Button>
              </div>
            ))
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() =>
              awardsFieldArray.append({ title: "", organization: "", award_year: "", description: "" })
            }
          >
            <Plus className="size-4" aria-hidden="true" />
            Add Award
          </Button>
        </div>
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
          Doctor FAQs
        </FieldLegend>
        <div className="flex flex-col gap-3">
          {faqsFieldArray.fields.length === 0 ? (
            <p className="text-body-sm text-muted-foreground">No FAQs added yet.</p>
          ) : (
            faqsFieldArray.fields.map((field, index) => (
              <div key={field.id} className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3">
                <Field data-invalid={!!errors.faqs?.[index]?.title || undefined}>
                  <FieldLabel htmlFor={`doctor-faq-question-${index}`}>
                    Question <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id={`doctor-faq-question-${index}`}
                    aria-invalid={!!errors.faqs?.[index]?.title || undefined}
                    {...register(`faqs.${index}.title` as const)}
                  />
                  <FieldError errors={[errors.faqs?.[index]?.title]} />
                </Field>

                <Field data-invalid={!!errors.faqs?.[index]?.text || undefined}>
                  <FieldLabel htmlFor={`doctor-faq-answer-${index}`}>
                    Answer <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Textarea
                    id={`doctor-faq-answer-${index}`}
                    rows={3}
                    aria-invalid={!!errors.faqs?.[index]?.text || undefined}
                    {...register(`faqs.${index}.text` as const)}
                  />
                  <FieldError errors={[errors.faqs?.[index]?.text]} />
                </Field>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-fit text-destructive hover:text-destructive"
                  onClick={() => faqsFieldArray.remove(index)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Remove FAQ
                </Button>
              </div>
            ))
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => faqsFieldArray.append({ title: "", text: "" })}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add FAQ
          </Button>
        </div>
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
          SEO
        </FieldLegend>
        <FormFieldGrid>
          <Field className="sm:col-span-2" data-invalid={!!errors.seo_url || undefined}>
            <FieldLabel htmlFor="doctor-seo-url">
              SEO URL <span className="text-destructive">*</span>
            </FieldLabel>
            <Input id="doctor-seo-url" aria-invalid={!!errors.seo_url || undefined} {...register("seo_url")} />
            <FieldError errors={[errors.seo_url]} />
          </Field>

          <Field data-invalid={!!errors.meta_title || undefined}>
            <FieldLabel htmlFor="doctor-meta-title">
              Meta Title <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="doctor-meta-title" {...register("meta_title")} />
            <FieldError errors={[errors.meta_title]} />
          </Field>

          <Field data-invalid={!!errors.meta_keywords || undefined}>
            <FieldLabel htmlFor="doctor-meta-keywords">
              Meta Keywords <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="doctor-meta-keywords" {...register("meta_keywords")} />
            <FieldError errors={[errors.meta_keywords]} />
          </Field>

          <Field className="sm:col-span-2" data-invalid={!!errors.meta_description || undefined}>
            <FieldLabel htmlFor="doctor-meta-description">
              Meta Description <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Textarea id="doctor-meta-description" rows={3} {...register("meta_description")} />
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
          {mode === "create" ? "Create Doctor" : "Save Changes"}
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
