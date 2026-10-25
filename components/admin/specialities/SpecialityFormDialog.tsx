"use client";

import { useMemo, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/admin/FormDialog";
import { FormFieldGrid } from "@/components/admin/FormFieldGrid";
import { FileUploadArea } from "@/components/admin/FileUploadArea";
import { TreatmentImageField } from "@/components/admin/TreatmentImageField";
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
import { SpecialitySectionsPanel } from "@/components/admin/specialities/SpecialitySectionsPanel";
import { SpecialityContentSectionsDialog } from "@/components/admin/specialities/SpecialityContentSectionsDialog";
import { SpecialityWhyChooseUsDialog } from "@/components/admin/specialities/SpecialityWhyChooseUsDialog";
import { SpecialityFinalCtaDialog } from "@/components/admin/specialities/SpecialityFinalCtaDialog";
import { SpecialityFaqsEditor, type SpecialityFaqDraft } from "@/components/admin/specialities/SpecialityFaqsEditor";
import { ApiError } from "@/lib/api/client";
import { createSpeciality, getSpeciality, listSpecialities, updateSpeciality } from "@/lib/api/specialities";
import { createSpecialityFaq, deleteSpecialityFaq, listSpecialityFaqs, updateSpecialityFaq } from "@/lib/api/speciality-faqs";
import { listCities } from "@/lib/api/cities";
import { listLocations } from "@/lib/api/locations";
import { listHospitals } from "@/lib/api/hospitals";
import { listDoctorSpecialities } from "@/lib/api/doctor-specialities";
import { generateSpecialityContent } from "@/lib/api/ai-generation";
import { notify } from "@/lib/toast";
import { specialitiesKeys, hospitalsKeys, specialityFaqsKeys } from "@/components/admin/specialities/queries";
import { citiesKeys } from "@/components/admin/cities/queries";
import { locationsKeys } from "@/components/admin/locations/queries";
import { doctorSpecialityOptionsKeys } from "@/components/admin/doctors/queries";
import type { Speciality } from "@/types/speciality";

const NO_LOCATION_VALUE = "none";
const NO_HOSPITAL_VALUE = "none";
const NO_PARENT_VALUE = "none";
const NO_DOCTOR_SPECIALITY_VALUE = "none";
const LOGO_ACCEPT = "image/jpeg,image/png,image/webp";
const LOGO_HINT = "JPG, PNG or WEBP, up to 5MB";
type TabValue = "basic" | "content" | "faqs" | "seo";

// Mirrors validators/speciality.validator.ts's createSpecialitySchema —
// speciality_logo is deliberately excluded (handled separately as File
// state below, multipart, not part of this JSON-shaped RHF schema).
const specialityFormSchema = z.object({
  speciality_name: z.string().trim().min(1, "Speciality name is required").max(255, "Name is too long"),
  speciality_title: z.string().trim().max(255, "Title is too long").optional(),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255, "SEO URL is too long"),
  meta_title: z.string().trim().max(255, "Meta title is too long").optional(),
  meta_description: z.string().trim().optional(),
  meta_keyword: z.string().trim().max(500, "Meta keyword is too long").optional(),
  city_id: z.string().min(1, "City is required"),
  location_id: z.string(),
  hospital_id: z.string(),
  short_description: z.string().trim().optional(),
  parent_speciality_id: z.string(),
  doctor_speciality_id: z.string(),
  keywords_for_doctors: z.string().trim().max(500, "Keywords are too long").optional(),
  status: z.enum(["active", "inactive"]),
  ai_content_generator: z.boolean(),
  description: z.string().optional(),
});

type SpecialityFormValues = z.infer<typeof specialityFormSchema>;

type SpecialityFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  specialityId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function SpecialityFormDialog({ open, mode, specialityId, onOpenChange }: SpecialityFormDialogProps) {
  // Flips once a *create* session saves successfully, so the dialog's own
  // title/description read as "Edit Speciality" for the rest of that
  // session — the form itself (see SpecialityForm) has already seamlessly
  // moved from "creating" to "editing this new speciality" without
  // closing/reopening, same pattern as PageFormDialog.
  const [justCreated, setJustCreated] = useState(false);
  const effectiveMode = justCreated ? "edit" : mode;

  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setJustCreated(false);
        onOpenChange(next);
      }}
      title={effectiveMode === "create" ? "Add Speciality" : "Edit Speciality"}
      description={
        effectiveMode === "create"
          ? "Create a new speciality, then configure its content sections without leaving this window."
          : "Update this speciality's details, content sections, and SEO."
      }
      className="sm:max-w-3xl"
    >
      {open && (
        <SpecialityFormBody
          key={mode === "edit" ? (specialityId ?? "edit") : "create"}
          mode={mode}
          specialityId={specialityId}
          onCreated={() => setJustCreated(true)}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function SpecialityFormBody({
  mode,
  specialityId,
  onCreated,
  onOpenChange,
}: {
  mode: "create" | "edit";
  specialityId: number | null;
  onCreated: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const specialityQuery = useQuery({
    queryKey: specialitiesKeys.detail(specialityId ?? -1),
    queryFn: () => getSpeciality(specialityId as number),
    enabled: mode === "edit" && specialityId !== null,
  });

  if (mode === "edit" && specialityQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading speciality…
      </div>
    );
  }

  if (mode === "edit" && specialityQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {specialityQuery.error instanceof ApiError ? specialityQuery.error.message : "Failed to load speciality."}
      </p>
    );
  }

  return (
    <SpecialityForm
      mode={mode}
      initialSpeciality={specialityQuery.data?.speciality}
      onCreated={onCreated}
      onOpenChange={onOpenChange}
    />
  );
}

function SpecialityForm({
  mode,
  initialSpeciality,
  onCreated,
  onOpenChange,
}: {
  mode: "create" | "edit";
  initialSpeciality?: Speciality;
  onCreated: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  // `liveSpeciality` is the source of truth for "does a real, saved
  // speciality exist to attach sections to right now" — present from the
  // start in edit mode (`initialSpeciality`), or set the moment a
  // create-mutation succeeds (see `mutation.onSuccess`), whichever comes
  // first. Same pattern as PageFormDialog's `livePage`.
  const [liveSpeciality, setLiveSpeciality] = useState<Speciality | undefined>(initialSpeciality);
  const [activeTab, setActiveTab] = useState<TabValue>(mode === "edit" ? "content" : "basic");
  const [contentSectionsOpen, setContentSectionsOpen] = useState(false);
  const [whyChooseUsOpen, setWhyChooseUsOpen] = useState(false);
  const [finalCtaOpen, setFinalCtaOpen] = useState(false);

  const citiesQuery = useQuery({ queryKey: citiesKeys.all, queryFn: listCities });
  const locationsQuery = useQuery({ queryKey: locationsKeys.all, queryFn: listLocations });
  const hospitalsQuery = useQuery({ queryKey: hospitalsKeys.all, queryFn: () => listHospitals() });
  const specialitiesQuery = useQuery({ queryKey: specialitiesKeys.all, queryFn: () => listSpecialities() });
  // Nationwide doctor_specialities taxonomy — NOT doctors.id. Shares its
  // cache with Doctors Management's own "map specialities" combobox (same
  // key, same `status: "active"` filter) since both just list the same
  // /api/doctor-specialities data — see components/admin/doctors/queries.ts.
  const doctorSpecialitiesQuery = useQuery({
    queryKey: doctorSpecialityOptionsKeys.active,
    queryFn: () => listDoctorSpecialities({ status: "active" }),
  });

  const cities = citiesQuery.data?.cities ?? [];
  const allLocations = useMemo(() => locationsQuery.data?.locations ?? [], [locationsQuery.data]);
  const hospitals = hospitalsQuery.data?.hospitals ?? [];
  const doctorSpecialities = doctorSpecialitiesQuery.data?.doctorSpecialities ?? [];
  // A speciality can't be its own parent — excluded here as basic client-side
  // sanity; the backend still authoritatively rejects cycles.
  const parentOptions = useMemo(
    () => (specialitiesQuery.data?.specialities ?? []).filter((speciality) => speciality.id !== liveSpeciality?.id),
    [specialitiesQuery.data, liveSpeciality?.id]
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SpecialityFormValues>({
    resolver: zodResolver(specialityFormSchema),
    defaultValues: {
      speciality_name: initialSpeciality?.speciality_name ?? "",
      speciality_title: initialSpeciality?.speciality_title ?? "",
      seo_url: initialSpeciality?.seo_url ?? "",
      meta_title: initialSpeciality?.meta_title ?? "",
      meta_description: initialSpeciality?.meta_description ?? "",
      meta_keyword: initialSpeciality?.meta_keyword ?? "",
      city_id: initialSpeciality ? String(initialSpeciality.city_id) : "",
      location_id: initialSpeciality?.location_id ? String(initialSpeciality.location_id) : NO_LOCATION_VALUE,
      hospital_id: initialSpeciality?.hospital_id ? String(initialSpeciality.hospital_id) : NO_HOSPITAL_VALUE,
      short_description: initialSpeciality?.short_description ?? "",
      parent_speciality_id: initialSpeciality?.parent_speciality_id
        ? String(initialSpeciality.parent_speciality_id)
        : NO_PARENT_VALUE,
      doctor_speciality_id: initialSpeciality?.doctor_speciality_id
        ? String(initialSpeciality.doctor_speciality_id)
        : NO_DOCTOR_SPECIALITY_VALUE,
      keywords_for_doctors: initialSpeciality?.keywords_for_doctors ?? "",
      status: initialSpeciality?.status === "inactive" ? "inactive" : "active",
      ai_content_generator: initialSpeciality?.ai_content_generator ?? false,
      description: initialSpeciality?.description ?? "",
    },
  });

  const selectedCityId = watch("city_id");
  const aiContentGeneratorEnabled = watch("ai_content_generator");
  const specialityNameValue = watch("speciality_name");

  const [logoFiles, setLogoFiles] = useState<File[]>([]);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [cardIconFiles, setCardIconFiles] = useState<File[]>([]);
  const [cardIconRemoved, setCardIconRemoved] = useState(false);

  const [faqs, setFaqs] = useState<SpecialityFaqDraft[]>([]);
  const [originalFaqIds, setOriginalFaqIds] = useState<number[]>([]);
  const [faqsInitialized, setFaqsInitialized] = useState(false);

  // Gated on `liveSpeciality` (not `mode === "edit"`) so this also fires
  // right after a *create* succeeds: the dialog stays open and quietly
  // moves into an edit session for the speciality that just got created
  // (see `mutation.onSuccess` below and the same pattern `liveSpeciality`
  // already establishes for the Content tab) — at that moment the FAQs
  // this admin already typed have just been persisted server-side too, so
  // this reloads them with their real ids instead of leaving the local
  // drafts pointing at `id: null`.
  const specialityFaqsQuery = useQuery({
    queryKey: specialityFaqsKeys.bySpeciality(liveSpeciality?.id ?? -1),
    queryFn: () => listSpecialityFaqs(liveSpeciality?.id as number),
    enabled: !!liveSpeciality,
  });

  if (liveSpeciality && !faqsInitialized && specialityFaqsQuery.data) {
    const loaded: SpecialityFaqDraft[] = specialityFaqsQuery.data.specialityFaqs.map((faq) => ({
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

  const locationOptions = useMemo(
    () => allLocations.filter((location) => String(location.city_id) === selectedCityId),
    [allLocations, selectedCityId]
  );

  // Bumped after each successful AI generation to force the RichTextEditor
  // Controller below to remount — RichTextEditor deliberately reads `value`
  // only once at mount (to protect the user's cursor while typing), so
  // pushing freshly-generated content in requires a clean remount rather
  // than relying on a prop update it would otherwise ignore.
  const [aiDraftVersion, setAiDraftVersion] = useState(0);
  const [showAiDraftNote, setShowAiDraftNote] = useState(false);

  const generateMutation = useMutation({
    mutationFn: () => {
      const cityId = getValues("city_id");
      const cityName = cities.find((city) => String(city.id) === cityId)?.city_name;
      const specialityTitle = (getValues("speciality_title") ?? "").trim();
      const existingShortDescription = (getValues("short_description") ?? "").trim();

      return generateSpecialityContent({
        entity_type: "speciality",
        speciality_name: getValues("speciality_name").trim(),
        speciality_title: specialityTitle || undefined,
        city_name: cityName,
        existing_short_description: existingShortDescription || undefined,
      });
    },
    onSuccess: ({ content }) => {
      // Only the AI-generated content fields are touched — city, hospital,
      // parent, status, logo, keywords-for-doctors, etc. are left exactly
      // as the admin set them.
      setValue("description", content.description, { shouldDirty: true });
      setValue("short_description", content.short_description, { shouldDirty: true });
      setValue("meta_title", content.meta_title, { shouldDirty: true });
      setValue("meta_description", content.meta_description, { shouldDirty: true });
      setValue("meta_keyword", content.meta_keyword, { shouldDirty: true });
      setAiDraftVersion((version) => version + 1);
      setShowAiDraftNote(true);
      notify.success("AI draft generated — review before saving.");
    },
    onError: (error) => {
      notify.apiError(error, "Failed to generate content with AI.");
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: SpecialityFormValues) => {
      const payload = {
        speciality_name: values.speciality_name,
        speciality_title: values.speciality_title ? values.speciality_title : null,
        seo_url: values.seo_url,
        meta_title: values.meta_title ? values.meta_title : null,
        meta_description: values.meta_description ? values.meta_description : null,
        meta_keyword: values.meta_keyword ? values.meta_keyword : null,
        city_id: Number(values.city_id),
        location_id: values.location_id === NO_LOCATION_VALUE ? null : Number(values.location_id),
        hospital_id: values.hospital_id === NO_HOSPITAL_VALUE ? null : Number(values.hospital_id),
        short_description: values.short_description ? values.short_description : null,
        parent_speciality_id: values.parent_speciality_id === NO_PARENT_VALUE ? null : Number(values.parent_speciality_id),
        doctor_speciality_id:
          values.doctor_speciality_id === NO_DOCTOR_SPECIALITY_VALUE ? null : Number(values.doctor_speciality_id),
        // global_speciality_id is deliberately OMITTED here, not set to
        // null — this form no longer has a field for it (see the
        // Navigation section of GlobalSpecialityFormDialog.tsx, which is
        // where this relationship is actually managed now). Per
        // validators/speciality.validator.ts's own doc comment on
        // nullableIdFromFormSchema: "omitting the field entirely leaves
        // the existing value unchanged on update" — the API client
        // (lib/api/specialities.ts) only appends this key to FormData
        // when it is NOT undefined, so leaving it out of this payload is
        // what keeps any existing link intact rather than clearing it.
        keywords_for_doctors: values.keywords_for_doctors ? values.keywords_for_doctors : null,
        status: values.status,
        ai_content_generator: values.ai_content_generator,
        description: values.description ? values.description : null,
      };
      const image = logoFiles.length > 0 ? logoFiles[0] : logoRemoved ? null : undefined;
      const cardIcon = cardIconFiles.length > 0 ? cardIconFiles[0] : cardIconRemoved ? null : undefined;
      const result = liveSpeciality
        ? await updateSpeciality(liveSpeciality.id, payload, image, cardIcon)
        : await createSpeciality(payload, image, cardIcon);

      // Syncs FAQs through the same existing CRUD endpoints the standalone
      // Speciality FAQs admin module uses — for a new speciality this is
      // the id the API just assigned, not `liveSpeciality?.id` (undefined
      // in create mode). Not wrapped in try/catch: a failure here throws
      // out of mutationFn, so onError fires and onSuccess never does — no
      // false "success" toast if the speciality saved but an FAQ failed
      // to sync.
      const currentIds = faqs.filter((faq) => faq.id !== null).map((faq) => faq.id as number);
      const toDelete = originalFaqIds.filter((id) => !currentIds.includes(id));

      await Promise.all([
        ...faqs.map((faq) =>
          faq.id === null
            ? createSpecialityFaq({
                speciality_id: result.speciality.id,
                title: faq.title,
                text: faq.text,
                status: faq.status,
              })
            : updateSpecialityFaq(faq.id, {
                title: faq.title,
                text: faq.text,
                status: faq.status,
              })
        ),
        ...toDelete.map((id) => deleteSpecialityFaq(id)),
      ]);

      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: specialitiesKeys.all });
      queryClient.invalidateQueries({ queryKey: specialityFaqsKeys.bySpeciality(data.speciality.id) });

      if (!liveSpeciality) {
        // This was a create — stay open, move into a live edit session for
        // the speciality that just got created, and jump straight to
        // Speciality Content instead of making the admin close and
        // reopen the dialog.
        setLiveSpeciality(data.speciality);
        setActiveTab("content");
        onCreated();
        notify.success("Speciality created. Configure its sections below whenever you're ready.");
        return;
      }

      notify.success("Speciality updated successfully.");
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: SpecialityFormValues) => {
    mutation.mutate(values);
  };

  const saveLabel = liveSpeciality ? "Save Changes" : "Create Speciality";
  const cancelLabel = liveSpeciality ? "Close" : "Cancel";

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex min-w-0 flex-col">
      {/*
        `min-w-0`: this form is a grid item inside DialogContent, whose
        implicit grid track defaults to `min-width: auto` — without this,
        the Tabs/TabsList content below sets a large intrinsic min-content
        that the form refuses to shrink below, so on narrow viewports the
        whole form (footer included) renders wider than the dialog and
        bleeds off-screen instead of wrapping/truncating like it should.
        The scrollable middle region is bounded to its own max-height so
        the footer below it sits in normal flow instead of needing
        `position: sticky` — combining sticky with the shared
        DialogFooter's negative bottom margin previously caused the
        footer to visually overlap and intercept clicks on whatever sat
        directly above it (hit and fixed once already on the equivalent
        Pages dialog; avoided here from the start).
      */}
      <div className="max-h-[60vh] overflow-y-auto pr-1">
        {mutation.isError && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {mutation.error instanceof ApiError ? mutation.error.message : "Something went wrong."}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
          <TabsList className="sticky top-0 z-10 -mt-1 grid w-full grid-cols-4 bg-popover pt-1 pb-2">
            <TabsTrigger value="basic" className="min-w-0">
              <span className="truncate">Basic Information</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="min-w-0">
              <span className="truncate">Speciality Content</span>
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
                Speciality Information
              </FieldLegend>
              <FormFieldGrid>
                <Field data-invalid={!!errors.speciality_name || undefined}>
                  <FieldLabel htmlFor="speciality-name">
                    Speciality Name <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input id="speciality-name" aria-invalid={!!errors.speciality_name || undefined} {...register("speciality_name")} />
                  <FieldError errors={[errors.speciality_name]} />
                </Field>

                <Field data-invalid={!!errors.speciality_title || undefined}>
                  <FieldLabel htmlFor="speciality-title">
                    Speciality Title <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Input id="speciality-title" {...register("speciality_title")} />
                  <FieldError errors={[errors.speciality_title]} />
                </Field>

                <Field data-invalid={!!errors.city_id || undefined}>
                  <FieldLabel htmlFor="speciality-city">
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
                        <SelectTrigger id="speciality-city" className="w-full">
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
                  <FieldLabel htmlFor="speciality-location">Location</FieldLabel>
                  <Controller
                    name="location_id"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={!selectedCityId}>
                        <SelectTrigger id="speciality-location" className="w-full">
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
                  <FieldLabel htmlFor="speciality-hospital">
                    Hospital <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Controller
                    name="hospital_id"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={hospitalsQuery.isLoading}>
                        <SelectTrigger id="speciality-hospital" className="w-full">
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

                <Field data-invalid={!!errors.doctor_speciality_id || undefined}>
                  <FieldLabel htmlFor="speciality-doctor-speciality">
                    Doctor Speciality <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Controller
                    name="doctor_speciality_id"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={doctorSpecialitiesQuery.isLoading}>
                        <SelectTrigger id="speciality-doctor-speciality" className="w-full">
                          <SelectValue placeholder={doctorSpecialitiesQuery.isLoading ? "Loading…" : "Select a doctor speciality"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_DOCTOR_SPECIALITY_VALUE}>None</SelectItem>
                          {doctorSpecialities.map((doctorSpeciality) => (
                            <SelectItem key={doctorSpeciality.id} value={String(doctorSpeciality.id)}>
                              {doctorSpeciality.speciality_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <p className="text-helper">Which doctor taxonomy this speciality maps to — controls the public Doctors section.</p>
                  <FieldError errors={[errors.doctor_speciality_id]} />
                </Field>

                <Field data-invalid={!!errors.parent_speciality_id || undefined}>
                  <FieldLabel htmlFor="speciality-parent">Parent Speciality</FieldLabel>
                  <Controller
                    name="parent_speciality_id"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={specialitiesQuery.isLoading}>
                        <SelectTrigger id="speciality-parent" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_PARENT_VALUE}>None (top-level)</SelectItem>
                          {parentOptions.map((speciality) => (
                            <SelectItem key={speciality.id} value={String(speciality.id)}>
                              {speciality.speciality_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError errors={[errors.parent_speciality_id]} />
                </Field>

                <Field data-invalid={!!errors.status || undefined}>
                  <FieldLabel htmlFor="speciality-status">Status</FieldLabel>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="speciality-status" className="w-full">
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
                  <FieldLabel htmlFor="speciality-keywords-for-doctors">
                    Keywords for Doctors <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Input id="speciality-keywords-for-doctors" {...register("keywords_for_doctors")} />
                  <FieldError errors={[errors.keywords_for_doctors]} />
                </Field>

                <Field className="sm:col-span-2">
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3">
                    <div>
                      <FieldLabel htmlFor="speciality-ai-content-generator">AI Content Generator</FieldLabel>
                      <p className="text-helper">Enable AI-assisted content generation for this speciality.</p>
                    </div>
                    <Controller
                      name="ai_content_generator"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="speciality-ai-content-generator"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </Field>

                <Field className="sm:col-span-2">
                  <FieldLabel>
                    Speciality Logo <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  {liveSpeciality?.speciality_logo && !logoRemoved && logoFiles.length === 0 && (
                    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                      {/* eslint-disable-next-line @next/next/no-img-element -- small preview of the currently stored image. */}
                      <img
                        src={liveSpeciality.speciality_logo}
                        alt=""
                        className="size-10 shrink-0 rounded-md border border-border object-contain"
                      />
                      <span className="flex-1 text-body-sm text-muted-foreground">Current logo — upload a new file to replace it.</span>
                      <button
                        type="button"
                        onClick={() => setLogoRemoved(true)}
                        disabled={mutation.isPending}
                        className="shrink-0 text-body-sm font-medium text-destructive hover:underline disabled:pointer-events-none disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  <FileUploadArea
                    files={logoFiles}
                    onFilesChange={(files) => {
                      setLogoFiles(files);
                      if (files.length > 0) setLogoRemoved(false);
                    }}
                    accept={LOGO_ACCEPT}
                    hint={LOGO_HINT}
                    disabled={mutation.isPending}
                  />
                </Field>

                <TreatmentImageField
                  label="Speciality Card Icon"
                  description="Small square icon or transparent image shown on speciality listing cards. If empty, a default icon is used — the hero image is never used here."
                  currentUrl={liveSpeciality?.card_icon}
                  files={cardIconFiles}
                  onFilesChange={(files) => {
                    setCardIconFiles(files);
                    if (files.length > 0) setCardIconRemoved(false);
                  }}
                  removed={cardIconRemoved}
                  onRemove={() => setCardIconRemoved(true)}
                  disabled={mutation.isPending}
                />
              </FormFieldGrid>
            </FieldSet>

            <FieldSet>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
                  Description
                </FieldLegend>
                {aiContentGeneratorEnabled && (
                  <LoadingButton
                    type="button"
                    variant="outline"
                    size="sm"
                    loading={generateMutation.isPending}
                    disabled={!specialityNameValue.trim() || mutation.isPending}
                    onClick={() => generateMutation.mutate()}
                  >
                    <Sparkles className="size-4" aria-hidden="true" />
                    Generate with AI
                  </LoadingButton>
                )}
              </div>
              {showAiDraftNote && (
                <p className="flex items-center gap-1.5 text-helper text-primary">
                  <Sparkles className="size-3" aria-hidden="true" />
                  AI-generated draft below — review and edit before saving.
                </p>
              )}
              <FormFieldGrid>
                <Field className="sm:col-span-2" data-invalid={!!errors.short_description || undefined}>
                  <FieldLabel htmlFor="speciality-short-description">
                    Short Description <span className="text-muted-foreground">(optional — used by the Hero section)</span>
                  </FieldLabel>
                  <Textarea id="speciality-short-description" rows={3} {...register("short_description")} />
                  <FieldError errors={[errors.short_description]} />
                </Field>

                <Field className="sm:col-span-2" data-invalid={!!errors.description || undefined}>
                  <FieldLabel htmlFor="speciality-description">
                    Description <span className="text-muted-foreground">(optional — used by the Overview section)</span>
                  </FieldLabel>
                  <Controller
                    key={aiDraftVersion}
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <RichTextEditor
                        id="speciality-description"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="Start writing the content for this speciality..."
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
                <p className="text-helper">Create and manage additional content sections for this speciality.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!liveSpeciality}
                  onClick={() => setContentSectionsOpen(true)}
                >
                  Manage Content Sections
                </Button>
              </div>
              {!liveSpeciality && (
                <p className="text-helper">Save the speciality first, then manage its content sections here.</p>
              )}
            </FieldSet>

            <FieldSet>
              <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
                Why Choose Us
              </FieldLegend>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3">
                <p className="text-helper">Manage the &quot;Why Choose Us&quot; heading and cards shown on this speciality&apos;s page.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!liveSpeciality}
                  onClick={() => setWhyChooseUsOpen(true)}
                >
                  Manage Why Choose Us
                </Button>
              </div>
              {!liveSpeciality && (
                <p className="text-helper">Save the speciality first, then manage Why Choose Us here.</p>
              )}
            </FieldSet>

            <FieldSet>
              <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
                Final CTA
              </FieldLegend>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3">
                <p className="text-helper">Manage the closing call-to-action shown at the bottom of this speciality&apos;s page.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!liveSpeciality}
                  onClick={() => setFinalCtaOpen(true)}
                >
                  Manage Final CTA
                </Button>
              </div>
              {!liveSpeciality && (
                <p className="text-helper">Save the speciality first, then manage the Final CTA here.</p>
              )}
            </FieldSet>
          </TabsContent>

          <TabsContent value="content" className="pt-1">
            {liveSpeciality ? (
              <SpecialitySectionsPanel specialityId={liveSpeciality.id} />
            ) : (
              <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-body-sm text-muted-foreground">
                Fill in Basic Information and save — you&apos;ll land right back here, ready to configure sections,
                with no need to reopen this dialog.
              </p>
            )}
          </TabsContent>

          <TabsContent value="faqs" className="flex flex-col gap-5 pt-1">
            <FieldSet>
              <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
                FAQs
              </FieldLegend>
              <p className="text-helper">Add frequently asked questions for this speciality.</p>
              {liveSpeciality && !faqsInitialized && specialityFaqsQuery.isLoading ? (
                <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Loading FAQs…
                </div>
              ) : (
                <SpecialityFaqsEditor faqs={faqs} onChange={setFaqs} disabled={mutation.isPending} />
              )}
            </FieldSet>
          </TabsContent>

          <TabsContent value="seo" className="flex flex-col gap-5 pt-1">
            <FieldSet>
              <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
                SEO
              </FieldLegend>
              <FormFieldGrid>
                <Field className="sm:col-span-2" data-invalid={!!errors.seo_url || undefined}>
                  <FieldLabel htmlFor="speciality-seo-url">
                    SEO URL <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input id="speciality-seo-url" aria-invalid={!!errors.seo_url || undefined} {...register("seo_url")} />
                  <FieldError errors={[errors.seo_url]} />
                </Field>

                <Field data-invalid={!!errors.meta_title || undefined}>
                  <FieldLabel htmlFor="speciality-meta-title">
                    Meta Title <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Input id="speciality-meta-title" {...register("meta_title")} />
                  <FieldError errors={[errors.meta_title]} />
                </Field>

                <Field data-invalid={!!errors.meta_keyword || undefined}>
                  <FieldLabel htmlFor="speciality-meta-keyword">
                    Meta Keyword <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Input id="speciality-meta-keyword" {...register("meta_keyword")} />
                  <FieldError errors={[errors.meta_keyword]} />
                </Field>

                <Field className="sm:col-span-2" data-invalid={!!errors.meta_description || undefined}>
                  <FieldLabel htmlFor="speciality-meta-description">
                    Meta Description <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Textarea id="speciality-meta-description" rows={3} {...register("meta_description")} />
                  <FieldError errors={[errors.meta_description]} />
                </Field>
              </FormFieldGrid>
            </FieldSet>
          </TabsContent>
        </Tabs>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting || mutation.isPending}>
          {cancelLabel}
        </Button>
        <LoadingButton type="submit" disabled={isSubmitting || generateMutation.isPending} loading={mutation.isPending}>
          {saveLabel}
        </LoadingButton>
      </DialogFooter>
      </form>

      <SpecialityContentSectionsDialog
        open={contentSectionsOpen}
        specialityId={liveSpeciality?.id ?? null}
        specialityName={liveSpeciality?.speciality_name}
        onOpenChange={setContentSectionsOpen}
      />

      <SpecialityWhyChooseUsDialog
        open={whyChooseUsOpen}
        specialityId={liveSpeciality?.id ?? null}
        specialityName={liveSpeciality?.speciality_name}
        onOpenChange={setWhyChooseUsOpen}
      />

      <SpecialityFinalCtaDialog
        open={finalCtaOpen}
        specialityId={liveSpeciality?.id ?? null}
        specialityName={liveSpeciality?.speciality_name}
        onOpenChange={setFinalCtaOpen}
      />
    </>
  );
}
