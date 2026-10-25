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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TreatmentSectionsPanel } from "@/components/admin/treatments/TreatmentSectionsPanel";
import { TreatmentContentSectionsDialog } from "@/components/admin/treatments/TreatmentContentSectionsDialog";
import { TreatmentLabelValueSectionDialog } from "@/components/admin/treatments/TreatmentLabelValueSectionDialog";
import { TreatmentOptionsDialog } from "@/components/admin/treatments/TreatmentOptionsDialog";
import { TreatmentEligibilityDialog } from "@/components/admin/treatments/TreatmentEligibilityDialog";
import { TreatmentWhyChooseUsDialog } from "@/components/admin/treatments/TreatmentWhyChooseUsDialog";
import { TreatmentProcessDialog } from "@/components/admin/treatments/TreatmentProcessDialog";
import { TreatmentJourneyDialog } from "@/components/admin/treatments/TreatmentJourneyDialog";
import { TreatmentPreparationRecoveryDialog } from "@/components/admin/treatments/TreatmentPreparationRecoveryDialog";
import { TreatmentFinalCtaDialog } from "@/components/admin/treatments/TreatmentFinalCtaDialog";
import { TreatmentFaqsEditor, type TreatmentFaqDraft } from "@/components/admin/treatments/TreatmentFaqsEditor";
import { ApiError } from "@/lib/api/client";
import { TreatmentImageField } from "@/components/admin/TreatmentImageField";
import { createTreatment, getTreatment, updateTreatment } from "@/lib/api/treatments";
import { createTreatmentFaq, deleteTreatmentFaq, listTreatmentFaqs, updateTreatmentFaq } from "@/lib/api/treatment-faqs";
import { listSpecialities } from "@/lib/api/specialities";
import { listLanguages } from "@/lib/api/languages";
import { listCities } from "@/lib/api/cities";
import { listLocations } from "@/lib/api/locations";
import { listHospitals } from "@/lib/api/hospitals";
import { listGlobalTreatments } from "@/lib/api/global-treatments";
import { notify } from "@/lib/toast";
import { treatmentsKeys, treatmentFaqsKeys } from "@/components/admin/treatments/queries";
import { globalTreatmentsKeys } from "@/components/admin/global-treatments/queries";
import { specialitiesKeys, hospitalsKeys } from "@/components/admin/specialities/queries";
import { citiesKeys } from "@/components/admin/cities/queries";
import { locationsKeys } from "@/components/admin/locations/queries";
import { languagesKeys } from "@/components/admin/languages/queries";
import type { Treatment } from "@/types/treatment";

const NO_LOCATION_VALUE = "none";
const NO_HOSPITAL_VALUE = "none";
const NO_GLOBAL_TREATMENT_VALUE = "none";
type TabValue = "basic" | "content" | "faqs" | "seo";

// Mirrors validators/treatment.validator.ts's createTreatmentSchema exactly —
// speciality_logo is handled separately as File state below since it's a
// multipart file, not part of this JSON-shaped schema.
const treatmentFormSchema = z.object({
  speciality_id: z.string().min(1, "Speciality is required"),
  sub_speciality_name: z.string().trim().min(1, "Sub-speciality name is required").max(255, "Name is too long"),
  sub_speciality_title: z.string().trim().max(255, "Title is too long").optional(),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255, "SEO URL is too long"),
  meta_title: z.string().trim().max(255, "Meta title is too long").optional(),
  meta_description: z.string().trim().optional(),
  meta_keyword: z.string().trim().max(500, "Meta keyword is too long").optional(),
  language_id: z.string().min(1, "Language is required"),
  city_id: z.string().min(1, "City is required"),
  location_id: z.string(),
  hospital_id: z.string(),
  short_description: z.string().trim().optional(),
  global_treatment_id: z.string(),
  keywords_for_doctors: z.string().trim().max(500, "Keywords are too long").optional(),
  status: z.enum(["active", "inactive"]),
  ai_content_generator: z.boolean(),
  description: z.string().optional(),
});

type TreatmentFormValues = z.infer<typeof treatmentFormSchema>;

type TreatmentFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  treatmentId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function TreatmentFormDialog({ open, mode, treatmentId, onOpenChange }: TreatmentFormDialogProps) {
  // Flips once a *create* session saves successfully, so the dialog's own
  // title/description read as "Edit Treatment" for the rest of that
  // session — the form itself has already seamlessly moved from
  // "creating" to "editing this new treatment" without closing/reopening,
  // same pattern as SpecialityFormDialog.
  const [justCreated, setJustCreated] = useState(false);
  const effectiveMode = justCreated ? "edit" : mode;

  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setJustCreated(false);
        onOpenChange(next);
      }}
      title={effectiveMode === "create" ? "Add Treatment" : "Edit Treatment"}
      description={
        effectiveMode === "create"
          ? "Create a new treatment, then configure its content sections without leaving this window."
          : "Update this treatment's details, content sections, and SEO."
      }
      className="sm:max-w-4xl"
    >
      {open && (
        <TreatmentFormBody
          key={mode === "edit" ? (treatmentId ?? "edit") : "create"}
          mode={mode}
          treatmentId={treatmentId}
          onCreated={() => setJustCreated(true)}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function TreatmentFormBody({
  mode,
  treatmentId,
  onCreated,
  onOpenChange,
}: {
  mode: "create" | "edit";
  treatmentId: number | null;
  onCreated: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const treatmentQuery = useQuery({
    queryKey: treatmentsKeys.detail(treatmentId ?? -1),
    queryFn: () => getTreatment(treatmentId as number),
    enabled: mode === "edit" && treatmentId !== null,
  });

  if (mode === "edit" && treatmentQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading treatment…
      </div>
    );
  }

  if (mode === "edit" && treatmentQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {treatmentQuery.error instanceof ApiError ? treatmentQuery.error.message : "Failed to load treatment."}
      </p>
    );
  }

  return (
    <TreatmentForm
      mode={mode}
      treatmentId={treatmentId}
      initialTreatment={treatmentQuery.data?.treatment}
      onCreated={onCreated}
      onOpenChange={onOpenChange}
    />
  );
}

function TreatmentForm({
  mode,
  treatmentId,
  initialTreatment,
  onCreated,
  onOpenChange,
}: {
  mode: "create" | "edit";
  treatmentId: number | null;
  initialTreatment?: Treatment;
  onCreated: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  // `liveTreatment` is the source of truth for "does a real, saved
  // treatment exist to attach sections to right now" — present from the
  // start in edit mode (`initialTreatment`), or set the moment a
  // create-mutation succeeds, whichever comes first. Same pattern as
  // SpecialityFormDialog's `liveSpeciality`.
  const [liveTreatment, setLiveTreatment] = useState<Treatment | undefined>(initialTreatment);
  const [activeTab, setActiveTab] = useState<TabValue>(mode === "edit" ? "content" : "basic");
  const [contentSectionsOpen, setContentSectionsOpen] = useState(false);
  const [highlightsOpen, setHighlightsOpen] = useState(false);
  const [factsOpen, setFactsOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [eligibilityOpen, setEligibilityOpen] = useState(false);
  const [whyChooseUsOpen, setWhyChooseUsOpen] = useState(false);
  const [processOpen, setProcessOpen] = useState(false);
  const [journeyOpen, setJourneyOpen] = useState(false);
  const [preparationRecoveryOpen, setPreparationRecoveryOpen] = useState(false);
  const [finalCtaOpen, setFinalCtaOpen] = useState(false);

  const specialitiesQuery = useQuery({ queryKey: specialitiesKeys.all, queryFn: () => listSpecialities() });
  const languagesQuery = useQuery({ queryKey: languagesKeys.all, queryFn: listLanguages });
  const citiesQuery = useQuery({ queryKey: citiesKeys.all, queryFn: listCities });
  const locationsQuery = useQuery({ queryKey: locationsKeys.all, queryFn: listLocations });
  const hospitalsQuery = useQuery({ queryKey: hospitalsKeys.all, queryFn: () => listHospitals() });
  // The city-independent "global" concept this treatment can optionally
  // link to — see global_treatments' own doc comment. Active-only, same
  // convention as every other relationship picker on this form.
  const globalTreatmentsQuery = useQuery({
    queryKey: [...globalTreatmentsKeys.all, "active"],
    queryFn: () => listGlobalTreatments({ status: "active" }),
  });

  const specialities = specialitiesQuery.data?.specialities ?? [];
  const languages = languagesQuery.data?.languages ?? [];
  const cities = citiesQuery.data?.cities ?? [];
  const allLocations = useMemo(() => locationsQuery.data?.locations ?? [], [locationsQuery.data]);
  const hospitals = hospitalsQuery.data?.hospitals ?? [];
  const globalTreatments = globalTreatmentsQuery.data?.globalTreatments ?? [];

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [cardIconFiles, setCardIconFiles] = useState<File[]>([]);
  const [cardIconRemoved, setCardIconRemoved] = useState(false);
  const [faqs, setFaqs] = useState<TreatmentFaqDraft[]>([]);
  const [originalFaqIds, setOriginalFaqIds] = useState<number[]>([]);
  const [faqsInitialized, setFaqsInitialized] = useState(false);

  const treatmentFaqsQuery = useQuery({
    queryKey: treatmentFaqsKeys.byTreatment(treatmentId ?? -1),
    queryFn: () => listTreatmentFaqs(treatmentId as number),
    enabled: mode === "edit" && treatmentId !== null,
  });

  // Preloads this treatment's existing FAQs exactly once — same
  // "initialized" guard BlogFormDialog uses for its own inline FAQ editor.
  // `originalFaqIds` is kept separately so the save step can tell which
  // real FAQs were removed from the local list (and should be
  // deactivated) vs. ones that were never persisted at all.
  if (mode === "edit" && !faqsInitialized && treatmentFaqsQuery.data) {
    const loaded: TreatmentFaqDraft[] = treatmentFaqsQuery.data.treatmentFaqs.map((faq) => ({
      key: String(faq.id),
      id: faq.id,
      title: faq.title,
      text: faq.text,
      status: faq.status,
    }));
    setFaqs(loaded);
    setOriginalFaqIds(loaded.map((faq) => faq.id as number));
    setFaqsInitialized(true);
  }

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TreatmentFormValues>({
    resolver: zodResolver(treatmentFormSchema),
    defaultValues: {
      speciality_id: initialTreatment ? String(initialTreatment.speciality_id) : "",
      sub_speciality_name: initialTreatment?.sub_speciality_name ?? "",
      sub_speciality_title: initialTreatment?.sub_speciality_title ?? "",
      seo_url: initialTreatment?.seo_url ?? "",
      meta_title: initialTreatment?.meta_title ?? "",
      meta_description: initialTreatment?.meta_description ?? "",
      meta_keyword: initialTreatment?.meta_keyword ?? "",
      language_id: initialTreatment ? String(initialTreatment.language_id) : "",
      city_id: initialTreatment ? String(initialTreatment.city_id) : "",
      location_id: initialTreatment?.location_id ? String(initialTreatment.location_id) : NO_LOCATION_VALUE,
      hospital_id: initialTreatment?.hospital_id ? String(initialTreatment.hospital_id) : NO_HOSPITAL_VALUE,
      short_description: initialTreatment?.short_description ?? "",
      global_treatment_id: initialTreatment?.global_treatment_id
        ? String(initialTreatment.global_treatment_id)
        : NO_GLOBAL_TREATMENT_VALUE,
      keywords_for_doctors: initialTreatment?.keywords_for_doctors ?? "",
      status: initialTreatment?.status === "inactive" ? "inactive" : "active",
      ai_content_generator: initialTreatment?.ai_content_generator ?? false,
      description: initialTreatment?.description ?? "",
    },
  });

  const selectedCityId = watch("city_id");

  const locationOptions = useMemo(
    () => allLocations.filter((location) => String(location.city_id) === selectedCityId),
    [allLocations, selectedCityId]
  );

  const mutation = useMutation({
    mutationFn: async (values: TreatmentFormValues) => {
      const payload = {
        speciality_id: Number(values.speciality_id),
        sub_speciality_name: values.sub_speciality_name,
        sub_speciality_title: values.sub_speciality_title ? values.sub_speciality_title : null,
        seo_url: values.seo_url,
        meta_title: values.meta_title ? values.meta_title : null,
        meta_description: values.meta_description ? values.meta_description : null,
        meta_keyword: values.meta_keyword ? values.meta_keyword : null,
        language_id: Number(values.language_id),
        city_id: Number(values.city_id),
        location_id: values.location_id === NO_LOCATION_VALUE ? null : Number(values.location_id),
        hospital_id: values.hospital_id === NO_HOSPITAL_VALUE ? null : Number(values.hospital_id),
        short_description: values.short_description ? values.short_description : null,
        global_treatment_id: values.global_treatment_id === NO_GLOBAL_TREATMENT_VALUE ? null : Number(values.global_treatment_id),
        keywords_for_doctors: values.keywords_for_doctors ? values.keywords_for_doctors : null,
        status: values.status,
        ai_content_generator: values.ai_content_generator,
        description: values.description ? values.description : null,
      };
      const result =
        mode === "create"
          ? await createTreatment(payload, imageFiles[0], cardIconFiles[0])
          : await updateTreatment(
              treatmentId as number,
              payload,
              imageFiles[0],
              cardIconFiles.length > 0 ? cardIconFiles[0] : cardIconRemoved ? null : undefined
            );

      // Syncs FAQs through the same existing CRUD endpoints the standalone
      // Treatment FAQs admin module uses — for a new treatment this is the
      // id the API just assigned, not treatmentId (null in create mode).
      // Not wrapped in try/catch: a failure here throws out of mutationFn,
      // so onError fires and onSuccess never does — no false "success"
      // toast if the treatment saved but an FAQ failed to sync.
      const currentIds = faqs.filter((faq) => faq.id !== null).map((faq) => faq.id as number);
      const toDelete = originalFaqIds.filter((id) => !currentIds.includes(id));

      await Promise.all([
        ...faqs.map((faq) =>
          faq.id === null
            ? createTreatmentFaq({
                treatment_id: result.treatment.id,
                title: faq.title,
                text: faq.text,
                status: faq.status,
              })
            : updateTreatmentFaq(faq.id, {
                title: faq.title,
                text: faq.text,
                status: faq.status,
              })
        ),
        ...toDelete.map((id) => deleteTreatmentFaq(id)),
      ]);

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: treatmentsKeys.all });
      queryClient.invalidateQueries({ queryKey: treatmentFaqsKeys.byTreatment(result.treatment.id) });

      if (mode === "create") {
        // Stays open, now editing the treatment that just got created,
        // and jumps straight to Treatment Content instead of making the
        // admin close and reopen the dialog.
        setLiveTreatment(result.treatment);
        setActiveTab("content");
        onCreated();
        notify.success("Treatment created. Configure its sections below whenever you're ready.");
        return;
      }

      setLiveTreatment(result.treatment);
      notify.success("Treatment updated successfully.");
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: TreatmentFormValues) => {
    mutation.mutate(values);
  };

  const saveLabel = mode === "create" && !liveTreatment ? "Create Treatment" : "Save Changes";

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        {mutation.isError && (
          <div role="alert" className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {mutation.error instanceof ApiError ? mutation.error.message : "Something went wrong."}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
          <TabsList className="sticky top-0 z-10 -mt-1 grid w-full grid-cols-4 bg-popover pt-1 pb-2">
            <TabsTrigger value="basic" className="min-w-0">
              <span className="truncate">Basic Information</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="min-w-0">
              <span className="truncate">Treatment Content</span>
            </TabsTrigger>
            <TabsTrigger value="faqs" className="min-w-0">
              <span className="truncate">FAQs</span>
            </TabsTrigger>
            <TabsTrigger value="seo" className="min-w-0">
              <span className="truncate">SEO</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="flex flex-col gap-5 pt-1">
            <FieldSet>
              <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
                Treatment Information
              </FieldLegend>
              <FormFieldGrid>
                <Field data-invalid={!!errors.sub_speciality_name || undefined}>
                  <FieldLabel htmlFor="treatment-name">
                    Sub-Speciality Name <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input id="treatment-name" aria-invalid={!!errors.sub_speciality_name || undefined} {...register("sub_speciality_name")} />
                  <FieldError errors={[errors.sub_speciality_name]} />
                </Field>

                <Field data-invalid={!!errors.sub_speciality_title || undefined}>
                  <FieldLabel htmlFor="treatment-title">
                    Sub-Speciality Title <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Input id="treatment-title" {...register("sub_speciality_title")} />
                  <FieldError errors={[errors.sub_speciality_title]} />
                </Field>

                <Field data-invalid={!!errors.speciality_id || undefined}>
                  <FieldLabel htmlFor="treatment-speciality">
                    Speciality <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Controller
                    name="speciality_id"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={specialitiesQuery.isLoading}>
                        <SelectTrigger id="treatment-speciality" className="w-full">
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

                <Field data-invalid={!!errors.language_id || undefined}>
                  <FieldLabel htmlFor="treatment-language">
                    Language <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Controller
                    name="language_id"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={languagesQuery.isLoading}>
                        <SelectTrigger id="treatment-language" className="w-full">
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
                  <FieldLabel htmlFor="treatment-city">
                    City <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Controller
                    name="city_id"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={(value) => field.onChange(value)} disabled={citiesQuery.isLoading}>
                        <SelectTrigger id="treatment-city" className="w-full">
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
                  <FieldLabel htmlFor="treatment-location">Location</FieldLabel>
                  <Controller
                    name="location_id"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={!selectedCityId}>
                        <SelectTrigger id="treatment-location" className="w-full">
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
                  <FieldLabel htmlFor="treatment-hospital">
                    Hospital <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Controller
                    name="hospital_id"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={hospitalsQuery.isLoading}>
                        <SelectTrigger id="treatment-hospital" className="w-full">
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

                <Field data-invalid={!!errors.global_treatment_id || undefined}>
                  <FieldLabel htmlFor="treatment-global-treatment">
                    Global Treatment <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Controller
                    name="global_treatment_id"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={globalTreatmentsQuery.isLoading}>
                        <SelectTrigger id="treatment-global-treatment" className="w-full">
                          <SelectValue placeholder={globalTreatmentsQuery.isLoading ? "Loading…" : "Select a global treatment"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_GLOBAL_TREATMENT_VALUE}>None</SelectItem>
                          {globalTreatments.map((globalTreatment) => (
                            <SelectItem key={globalTreatment.id} value={String(globalTreatment.id)}>
                              {globalTreatment.treatment_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <p className="text-helper">
                    Link this city treatment to a global treatment. This relationship is used to show available
                    cities on the global treatment page.
                  </p>
                  <FieldError errors={[errors.global_treatment_id]} />
                </Field>

                <Field data-invalid={!!errors.status || undefined}>
                  <FieldLabel htmlFor="treatment-status">Status</FieldLabel>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="treatment-status" className="w-full">
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

                <Field data-invalid={!!errors.keywords_for_doctors || undefined}>
                  <FieldLabel htmlFor="treatment-keywords-for-doctors">
                    Keywords for Doctors <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Input id="treatment-keywords-for-doctors" {...register("keywords_for_doctors")} />
                  <FieldError errors={[errors.keywords_for_doctors]} />
                </Field>

                <Field className="sm:col-span-2">
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3">
                    <div>
                      <FieldLabel htmlFor="treatment-ai-content-generator">AI Content Generator</FieldLabel>
                      <p className="text-helper">Marks this treatment as eligible for AI-assisted content generation.</p>
                    </div>
                    <Controller
                      name="ai_content_generator"
                      control={control}
                      render={({ field }) => (
                        <Switch id="treatment-ai-content-generator" checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                  </div>
                </Field>

                <TreatmentImageField
                  label="Hero Image"
                  description="Large image shown on this treatment's detail page."
                  currentUrl={mode === "edit" ? initialTreatment?.speciality_logo : null}
                  files={imageFiles}
                  onFilesChange={setImageFiles}
                  disabled={mutation.isPending}
                />

                <TreatmentImageField
                  label="Treatment Card Icon"
                  description="Small square icon or transparent image shown on treatment listing cards. If empty, a default icon is used — the hero image is never used here."
                  currentUrl={mode === "edit" ? initialTreatment?.card_icon : null}
                  files={cardIconFiles}
                  onFilesChange={(files) => {
                    setCardIconFiles(files);
                    if (files.length > 0) setCardIconRemoved(false);
                  }}
                  removed={cardIconRemoved}
                  onRemove={() => setCardIconRemoved(true)}
                  disabled={mutation.isPending}
                />

                <Field className="sm:col-span-2" data-invalid={!!errors.short_description || undefined}>
                  <FieldLabel htmlFor="treatment-short-description">
                    Short Description <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Textarea id="treatment-short-description" rows={3} {...register("short_description")} />
                  <FieldError errors={[errors.short_description]} />
                </Field>

                <Field className="sm:col-span-2" data-invalid={!!errors.description || undefined}>
                  <FieldLabel htmlFor="treatment-description">
                    Description <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <RichTextEditor
                        id="treatment-description"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="Start writing the content for this treatment..."
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
                Content Sections
              </FieldLegend>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3">
                <p className="text-helper">Add extra editorial content sections, and manage their images and rich text.</p>
                <Button type="button" variant="outline" size="sm" disabled={!liveTreatment} onClick={() => setContentSectionsOpen(true)}>
                  Manage Content Sections
                </Button>
              </div>
              {!liveTreatment && <p className="text-helper">Save the treatment first, then manage its content sections here.</p>}
            </FieldSet>

            <FieldSet>
              <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
                Highlights Strip
              </FieldLegend>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3">
                <p className="text-helper">Compact information strip shown right under the Hero (e.g. Procedure Time, Recovery).</p>
                <Button type="button" variant="outline" size="sm" disabled={!liveTreatment} onClick={() => setHighlightsOpen(true)}>
                  Manage Highlights
                </Button>
              </div>
              {!liveTreatment && <p className="text-helper">Save the treatment first, then manage Highlights here.</p>}
            </FieldSet>

            <FieldSet>
              <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
                Treatment Facts
              </FieldLegend>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3">
                <p className="text-helper">The &quot;At a Glance&quot; information table (procedure duration, hospital stay, etc.).</p>
                <Button type="button" variant="outline" size="sm" disabled={!liveTreatment} onClick={() => setFactsOpen(true)}>
                  Manage Treatment Facts
                </Button>
              </div>
              {!liveTreatment && <p className="text-helper">Save the treatment first, then manage Treatment Facts here.</p>}
            </FieldSet>

            <FieldSet>
              <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
                Types / Options
              </FieldLegend>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3">
                <p className="text-helper">Different treatment approaches/options, each with a description and key points.</p>
                <Button type="button" variant="outline" size="sm" disabled={!liveTreatment} onClick={() => setOptionsOpen(true)}>
                  Manage Types/Options
                </Button>
              </div>
              {!liveTreatment && <p className="text-helper">Save the treatment first, then manage Types/Options here.</p>}
            </FieldSet>

            <FieldSet>
              <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
                Eligibility
              </FieldLegend>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3">
                <p className="text-helper">&quot;Who Is a Candidate&quot; — an intro paragraph plus a list of indicators.</p>
                <Button type="button" variant="outline" size="sm" disabled={!liveTreatment} onClick={() => setEligibilityOpen(true)}>
                  Manage Eligibility
                </Button>
              </div>
              {!liveTreatment && <p className="text-helper">Save the treatment first, then manage Eligibility here.</p>}
            </FieldSet>

            <FieldSet>
              <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
                Why Choose Us
              </FieldLegend>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3">
                <p className="text-helper">Manage the reasons shown in this treatment&apos;s Why Choose Us section.</p>
                <Button type="button" variant="outline" size="sm" disabled={!liveTreatment} onClick={() => setWhyChooseUsOpen(true)}>
                  Manage Why Choose Us
                </Button>
              </div>
              {!liveTreatment && <p className="text-helper">Save the treatment first, then manage Why Choose Us here.</p>}
            </FieldSet>

            <FieldSet>
              <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
                Treatment Process
              </FieldLegend>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3">
                <p className="text-helper">The numbered &quot;How This Treatment Works&quot; editorial list.</p>
                <Button type="button" variant="outline" size="sm" disabled={!liveTreatment} onClick={() => setProcessOpen(true)}>
                  Manage Treatment Process
                </Button>
              </div>
              {!liveTreatment && <p className="text-helper">Save the treatment first, then manage the Treatment Process here.</p>}
            </FieldSet>

            <FieldSet>
              <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
                Patient Treatment Journey
              </FieldLegend>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3">
                <p className="text-helper">The scroll-animated timeline — any number of steps, last one is always the discharge state.</p>
                <Button type="button" variant="outline" size="sm" disabled={!liveTreatment} onClick={() => setJourneyOpen(true)}>
                  Manage Patient Journey
                </Button>
              </div>
              {!liveTreatment && <p className="text-helper">Save the treatment first, then manage the Patient Journey here.</p>}
            </FieldSet>

            <FieldSet>
              <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
                Preparation / Recovery / Aftercare
              </FieldLegend>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3">
                <p className="text-helper">The 3-column editorial block (typically Preparation, Recovery, Aftercare).</p>
                <Button type="button" variant="outline" size="sm" disabled={!liveTreatment} onClick={() => setPreparationRecoveryOpen(true)}>
                  Manage Preparation/Recovery
                </Button>
              </div>
              {!liveTreatment && <p className="text-helper">Save the treatment first, then manage this section here.</p>}
            </FieldSet>

            <FieldSet>
              <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
                Final CTA
              </FieldLegend>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3">
                <p className="text-helper">Manage the closing call-to-action shown at the bottom of this treatment&apos;s page.</p>
                <Button type="button" variant="outline" size="sm" disabled={!liveTreatment} onClick={() => setFinalCtaOpen(true)}>
                  Manage Final CTA
                </Button>
              </div>
              {!liveTreatment && <p className="text-helper">Save the treatment first, then manage the Final CTA here.</p>}
            </FieldSet>
          </TabsContent>

          <TabsContent value="content" className="pt-1">
            {liveTreatment ? (
              <TreatmentSectionsPanel treatmentId={liveTreatment.id} />
            ) : (
              <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-body-sm text-muted-foreground">
                Fill in Basic Information and save — you&apos;ll land right back here, ready to configure sections, with no need to
                reopen this dialog.
              </p>
            )}
          </TabsContent>

          <TabsContent value="faqs" className="pt-1">
            <FieldSet>
              <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
                FAQs
              </FieldLegend>
              {mode === "edit" && treatmentFaqsQuery.isLoading ? (
                <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Loading FAQs…
                </div>
              ) : (
                <TreatmentFaqsEditor faqs={faqs} onChange={setFaqs} disabled={mutation.isPending} />
              )}
            </FieldSet>
          </TabsContent>

          <TabsContent value="seo" className="pt-1">
            <FieldSet>
              <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
                SEO
              </FieldLegend>
              <FormFieldGrid>
                <Field className="sm:col-span-2" data-invalid={!!errors.seo_url || undefined}>
                  <FieldLabel htmlFor="treatment-seo-url">
                    SEO URL <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input id="treatment-seo-url" aria-invalid={!!errors.seo_url || undefined} {...register("seo_url")} />
                  <FieldError errors={[errors.seo_url]} />
                </Field>

                <Field data-invalid={!!errors.meta_title || undefined}>
                  <FieldLabel htmlFor="treatment-meta-title">
                    Meta Title <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Input id="treatment-meta-title" {...register("meta_title")} />
                  <FieldError errors={[errors.meta_title]} />
                </Field>

                <Field data-invalid={!!errors.meta_keyword || undefined}>
                  <FieldLabel htmlFor="treatment-meta-keyword">
                    Meta Keyword <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Input id="treatment-meta-keyword" {...register("meta_keyword")} />
                  <FieldError errors={[errors.meta_keyword]} />
                </Field>

                <Field className="sm:col-span-2" data-invalid={!!errors.meta_description || undefined}>
                  <FieldLabel htmlFor="treatment-meta-description">
                    Meta Description <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Textarea id="treatment-meta-description" rows={3} {...register("meta_description")} />
                  <FieldError errors={[errors.meta_description]} />
                </Field>
              </FormFieldGrid>
            </FieldSet>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting || mutation.isPending}>
            Cancel
          </Button>
          <LoadingButton type="submit" disabled={isSubmitting} loading={mutation.isPending}>
            {saveLabel}
          </LoadingButton>
        </DialogFooter>
      </form>

      <TreatmentContentSectionsDialog
        open={contentSectionsOpen}
        treatmentId={liveTreatment?.id ?? null}
        treatmentName={liveTreatment?.sub_speciality_name}
        onOpenChange={setContentSectionsOpen}
      />

      <TreatmentLabelValueSectionDialog
        open={highlightsOpen}
        treatmentId={liveTreatment?.id ?? null}
        treatmentName={liveTreatment?.sub_speciality_name}
        onOpenChange={setHighlightsOpen}
        sectionType="highlights"
        dialogTitle="Manage Highlights"
        itemNounSingular="Highlight"
        maxItems={8}
      />

      <TreatmentLabelValueSectionDialog
        open={factsOpen}
        treatmentId={liveTreatment?.id ?? null}
        treatmentName={liveTreatment?.sub_speciality_name}
        onOpenChange={setFactsOpen}
        sectionType="facts"
        dialogTitle="Manage Treatment Facts"
        itemNounSingular="Fact"
        maxItems={12}
      />

      <TreatmentOptionsDialog
        open={optionsOpen}
        treatmentId={liveTreatment?.id ?? null}
        treatmentName={liveTreatment?.sub_speciality_name}
        onOpenChange={setOptionsOpen}
      />

      <TreatmentEligibilityDialog
        open={eligibilityOpen}
        treatmentId={liveTreatment?.id ?? null}
        treatmentName={liveTreatment?.sub_speciality_name}
        onOpenChange={setEligibilityOpen}
      />

      <TreatmentWhyChooseUsDialog
        open={whyChooseUsOpen}
        treatmentId={liveTreatment?.id ?? null}
        treatmentName={liveTreatment?.sub_speciality_name}
        onOpenChange={setWhyChooseUsOpen}
      />

      <TreatmentProcessDialog
        open={processOpen}
        treatmentId={liveTreatment?.id ?? null}
        treatmentName={liveTreatment?.sub_speciality_name}
        onOpenChange={setProcessOpen}
      />

      <TreatmentJourneyDialog
        open={journeyOpen}
        treatmentId={liveTreatment?.id ?? null}
        treatmentName={liveTreatment?.sub_speciality_name}
        onOpenChange={setJourneyOpen}
      />

      <TreatmentPreparationRecoveryDialog
        open={preparationRecoveryOpen}
        treatmentId={liveTreatment?.id ?? null}
        treatmentName={liveTreatment?.sub_speciality_name}
        onOpenChange={setPreparationRecoveryOpen}
      />

      <TreatmentFinalCtaDialog
        open={finalCtaOpen}
        treatmentId={liveTreatment?.id ?? null}
        treatmentName={liveTreatment?.sub_speciality_name}
        onOpenChange={setFinalCtaOpen}
      />
    </>
  );
}
