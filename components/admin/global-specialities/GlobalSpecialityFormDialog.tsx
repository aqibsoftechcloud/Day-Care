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
import { TreatmentImageField } from "@/components/admin/TreatmentImageField";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlobalSpecialitySectionsPanel } from "@/components/admin/global-specialities/GlobalSpecialitySectionsPanel";
import { GlobalSpecialityFaqsEditor, type GlobalSpecialityFaqDraft } from "@/components/admin/global-specialities/GlobalSpecialityFaqsEditor";
import {
  GlobalSpecialityNavigationFields,
  NAV_NEW_PARENT_VALUE,
  NAV_TOP_LEVEL_VALUE,
  type GlobalSpecialityNavigationFieldsValue,
} from "@/components/admin/global-specialities/GlobalSpecialityNavigationFields";
import { ApiError } from "@/lib/api/client";
import {
  createGlobalSpeciality,
  getGlobalSpeciality,
  getGlobalSpecialityNavigation,
  setGlobalSpecialityNavigation,
  updateGlobalSpeciality,
} from "@/lib/api/global-specialities";
import {
  createGlobalSpecialityFaq,
  deleteGlobalSpecialityFaq,
  listGlobalSpecialityFaqs,
  updateGlobalSpecialityFaq,
} from "@/lib/api/global-speciality-faqs";
import { listMenus } from "@/lib/api/menus";
import { listLanguages } from "@/lib/api/languages";
import { notify } from "@/lib/toast";
import { usePermission } from "@/hooks/usePermission";
import {
  globalSpecialitiesKeys,
  globalSpecialityFaqsKeys,
  globalSpecialityNavigationKeys,
} from "@/components/admin/global-specialities/queries";
import { menusKeys } from "@/components/admin/menus/queries";
import { languagesKeys } from "@/components/admin/languages/queries";
import { getGlobalSpecialityUrl } from "@/lib/public/urls";
import type { GlobalSpeciality, SetGlobalSpecialityNavigationInput } from "@/types/global-speciality";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const IMAGE_HINT = "JPG, PNG, WEBP or GIF, up to 5MB";
type TabValue = "basic" | "content" | "faqs" | "seo";

/** Mirrors validators/global-speciality.validator.ts's createGlobalSpecialitySchema. Deliberately has NO city/hospital/location/doctor-speciality fields — a global speciality is city-independent by design. */
const globalSpecialityFormSchema = z.object({
  speciality_name: z.string().trim().min(1, "Speciality name is required").max(255, "Name is too long"),
  speciality_title: z.string().trim().max(255, "Title is too long").optional(),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255, "SEO URL is too long"),
  short_description: z.string().trim().optional(),
  description: z.string().optional(),
  meta_title: z.string().trim().max(255, "Meta title is too long").optional(),
  meta_keyword: z.string().trim().max(500, "Meta keyword is too long").optional(),
  meta_description: z.string().trim().optional(),
  status: z.enum(["active", "inactive"]),
});

type GlobalSpecialityFormValues = z.infer<typeof globalSpecialityFormSchema>;

/**
 * Which tab each schema field's inputs live on — used only to recover
 * from a validation failure (see `onInvalid` below). Radix's `TabsContent`
 * doesn't mount an inactive tab's DOM by default, so a required field on
 * a tab the admin isn't currently viewing (e.g. `speciality_name` on
 * Basic while they're on SEO) would otherwise fail validation with zero
 * visible feedback: `handleSubmit` just sets `errors` and never calls
 * `onSubmit`, so no request is ever sent and the FieldError for that
 * field is invisible because its tab isn't in the DOM at all.
 */
const FIELD_TABS: Partial<Record<keyof GlobalSpecialityFormValues, TabValue>> = {
  speciality_name: "basic",
  speciality_title: "basic",
  status: "basic",
  short_description: "basic",
  description: "basic",
  seo_url: "seo",
  meta_title: "seo",
  meta_keyword: "seo",
  meta_description: "seo",
};

type GlobalSpecialityFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  globalSpecialityId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function GlobalSpecialityFormDialog({ open, mode, globalSpecialityId, onOpenChange }: GlobalSpecialityFormDialogProps) {
  const [justCreated, setJustCreated] = useState(false);
  const effectiveMode = justCreated ? "edit" : mode;

  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setJustCreated(false);
        onOpenChange(next);
      }}
      title={effectiveMode === "create" ? "Add Global Speciality" : "Edit Global Speciality"}
      description={
        effectiveMode === "create"
          ? "Create a new global speciality, then configure its content without leaving this window."
          : "Update this global speciality's content and SEO."
      }
      className="sm:max-w-3xl"
    >
      {open && (
        <GlobalSpecialityFormBody
          key={mode === "edit" ? (globalSpecialityId ?? "edit") : "create"}
          mode={mode}
          globalSpecialityId={globalSpecialityId}
          onCreated={() => setJustCreated(true)}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function GlobalSpecialityFormBody({
  mode,
  globalSpecialityId,
  onCreated,
  onOpenChange,
}: {
  mode: "create" | "edit";
  globalSpecialityId: number | null;
  onCreated: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const globalSpecialityQuery = useQuery({
    queryKey: globalSpecialitiesKeys.detail(globalSpecialityId ?? -1),
    queryFn: () => getGlobalSpeciality(globalSpecialityId as number),
    enabled: mode === "edit" && globalSpecialityId !== null,
  });

  if (mode === "edit" && globalSpecialityQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading global speciality…
      </div>
    );
  }

  if (mode === "edit" && globalSpecialityQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {globalSpecialityQuery.error instanceof ApiError ? globalSpecialityQuery.error.message : "Failed to load global speciality."}
      </p>
    );
  }

  return (
    <GlobalSpecialityForm
      mode={mode}
      initialGlobalSpeciality={globalSpecialityQuery.data?.globalSpeciality}
      onCreated={onCreated}
      onOpenChange={onOpenChange}
    />
  );
}

function GlobalSpecialityForm({
  mode,
  initialGlobalSpeciality,
  onCreated,
  onOpenChange,
}: {
  mode: "create" | "edit";
  initialGlobalSpeciality?: GlobalSpeciality;
  onCreated: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const [liveGlobalSpeciality, setLiveGlobalSpeciality] = useState<GlobalSpeciality | undefined>(initialGlobalSpeciality);
  const [activeTab, setActiveTab] = useState<TabValue>(mode === "edit" ? "content" : "basic");

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GlobalSpecialityFormValues>({
    resolver: zodResolver(globalSpecialityFormSchema),
    defaultValues: {
      speciality_name: initialGlobalSpeciality?.speciality_name ?? "",
      speciality_title: initialGlobalSpeciality?.speciality_title ?? "",
      seo_url: initialGlobalSpeciality?.seo_url ?? "",
      short_description: initialGlobalSpeciality?.short_description ?? "",
      description: initialGlobalSpeciality?.description ?? "",
      meta_title: initialGlobalSpeciality?.meta_title ?? "",
      meta_keyword: initialGlobalSpeciality?.meta_keyword ?? "",
      meta_description: initialGlobalSpeciality?.meta_description ?? "",
      status: initialGlobalSpeciality?.status === "inactive" ? "inactive" : "active",
    },
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [cardIconFiles, setCardIconFiles] = useState<File[]>([]);
  const [cardIconRemoved, setCardIconRemoved] = useState(false);

  const [faqs, setFaqs] = useState<GlobalSpecialityFaqDraft[]>([]);
  const [originalFaqIds, setOriginalFaqIds] = useState<number[]>([]);
  const [faqsInitialized, setFaqsInitialized] = useState(false);

  const faqsQuery = useQuery({
    queryKey: globalSpecialityFaqsKeys.byGlobalSpeciality(liveGlobalSpeciality?.id ?? -1),
    queryFn: () => listGlobalSpecialityFaqs(liveGlobalSpeciality?.id as number),
    enabled: !!liveGlobalSpeciality,
  });

  if (liveGlobalSpeciality && !faqsInitialized && faqsQuery.data) {
    const loaded: GlobalSpecialityFaqDraft[] = faqsQuery.data.globalSpecialityFaqs.map((faq) => ({
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

  // Navigation configuration, now part of Basic Information rather than
  // its own tab — same "lives directly in this component, bundled into
  // the one big submit" treatment as FAQs above, not a second
  // independently-saved sub-module. Never depends on an unsaved id: on
  // create, these fields are editable from the start with sensible
  // defaults and are only persisted (via setGlobalSpecialityNavigation)
  // once the speciality itself has a real id, inside mutationFn below.
  const { canView: canViewPermission, canUpdate: canUpdatePermission } = usePermission();
  const canViewNav = canViewPermission("menu-management");
  const canEditNav = canUpdatePermission("global-specialities") && canUpdatePermission("menu-management");

  const [navValue, setNavValue] = useState<GlobalSpecialityNavigationFieldsValue>({
    showInNav: false,
    label: "",
    parentSelection: NAV_TOP_LEVEL_VALUE,
    newParentTitle: "",
    placement: "primary",
    sortingOrder: "0",
  });
  const [navLanguageId, setNavLanguageId] = useState<number | null>(null);
  const [navInitialized, setNavInitialized] = useState(false);

  const navigationQuery = useQuery({
    queryKey: globalSpecialityNavigationKeys.byGlobalSpeciality(liveGlobalSpeciality?.id ?? -1),
    queryFn: () => getGlobalSpecialityNavigation(liveGlobalSpeciality?.id as number),
    enabled: !!liveGlobalSpeciality && canViewNav,
  });

  const languagesQuery = useQuery({ queryKey: languagesKeys.all, queryFn: listLanguages });
  const languages = languagesQuery.data?.languages ?? [];

  // The "Parent menu" dropdown's options — the exact same global
  // top-level menu set the Menu Management Parent Menu dropdown already
  // uses (menusKeys.parentOptionsGlobal), reused rather than a second
  // query shape.
  const parentMenusQuery = useQuery({
    queryKey: menusKeys.parentOptionsGlobal(),
    queryFn: () => listMenus({ cityIdIsNull: true, status: "active" }),
    enabled: canViewNav,
  });
  const allGlobalMenus = parentMenusQuery.data?.menus ?? [];
  const currentNavMenuId = navigationQuery.data?.placement?.id ?? null;
  const navParentOptions = allGlobalMenus.filter((menu) => menu.parent_id === null && menu.id !== currentNavMenuId);

  // Seeds the navigation fields from the current configuration exactly
  // once — same conditional-setState-during-render pattern as the FAQs
  // seed above, not a useEffect. For a brand-new speciality (no
  // liveGlobalSpeciality yet) there is nothing to wait for, so this
  // seeds immediately with sensible defaults once languages are loaded.
  if (!navInitialized && languages.length > 0 && (!liveGlobalSpeciality || navigationQuery.data)) {
    const existingMenu = liveGlobalSpeciality ? navigationQuery.data?.placement ?? null : null;
    if (existingMenu) {
      setNavLanguageId(existingMenu.language_id);
      setNavValue({
        showInNav: true,
        label: existingMenu.title,
        parentSelection: existingMenu.parent_id === null ? NAV_TOP_LEVEL_VALUE : String(existingMenu.parent_id),
        newParentTitle: "",
        placement: existingMenu.parent_id === null ? existingMenu.placement : "primary",
        sortingOrder: String(existingMenu.sorting_order),
      });
    } else {
      const defaultLanguage = languages.find((l) => l.status === "active") ?? languages[0];
      if (defaultLanguage) setNavLanguageId(defaultLanguage.id);
    }
    setNavInitialized(true);
  }

  const liveSeoUrl = watch("seo_url");
  const liveSpecialityTitle = watch("speciality_title");
  const liveSpecialityName = watch("speciality_name");
  const navFallbackLabel = liveSpecialityTitle || liveSpecialityName || "";
  const navDestinationUrl = getGlobalSpecialityUrl(liveSeoUrl || "");

  const mutation = useMutation({
    mutationFn: async (values: GlobalSpecialityFormValues) => {
      const payload = {
        speciality_name: values.speciality_name,
        speciality_title: values.speciality_title ? values.speciality_title : null,
        seo_url: values.seo_url,
        short_description: values.short_description ? values.short_description : null,
        description: values.description ? values.description : null,
        meta_title: values.meta_title ? values.meta_title : null,
        meta_keyword: values.meta_keyword ? values.meta_keyword : null,
        meta_description: values.meta_description ? values.meta_description : null,
        status: values.status,
      };
      const image = imageFiles.length > 0 ? imageFiles[0] : imageRemoved ? null : undefined;
      const cardIcon = cardIconFiles.length > 0 ? cardIconFiles[0] : cardIconRemoved ? null : undefined;
      const result = liveGlobalSpeciality
        ? await updateGlobalSpeciality(liveGlobalSpeciality.id, payload, image, cardIcon)
        : await createGlobalSpeciality(payload, image, cardIcon);

      const currentIds = faqs.filter((faq) => faq.id !== null).map((faq) => faq.id as number);
      const toDelete = originalFaqIds.filter((id) => !currentIds.includes(id));

      // The core record above is already saved at this point. A failure
      // in the FAQ sync must NOT reject this whole mutation — if it did,
      // onSuccess would never run, liveGlobalSpeciality would never get
      // set, and retrying a brand-new creation would call
      // createGlobalSpeciality() again with the same (now-taken) seo_url
      // instead of updating the record that already exists.
      let faqSyncFailed = false;
      try {
        await Promise.all([
          ...faqs.map((faq) =>
            faq.id === null
              ? createGlobalSpecialityFaq({
                  global_speciality_id: result.globalSpeciality.id,
                  title: faq.title,
                  text: faq.text,
                  status: faq.status,
                })
              : updateGlobalSpecialityFaq(faq.id, { title: faq.title, text: faq.text, status: faq.status })
          ),
          ...toDelete.map((id) => deleteGlobalSpecialityFaq(id)),
        ]);
      } catch {
        faqSyncFailed = true;
      }

      // Same "never reject the whole mutation" treatment as FAQs above —
      // this always runs AFTER the core record has a real id, so
      // navigation configuration is never persisted against an unsaved
      // speciality. Only attempted when the admin actually has
      // menu-management permission; otherwise the fields are read-only
      // and there is nothing new to persist.
      let navSyncFailed = false;
      if (canEditNav) {
        try {
          const navInput: SetGlobalSpecialityNavigationInput = !navValue.showInNav
            ? { show: false }
            : {
                show: true,
                language_id:
                  navLanguageId ?? (languages.find((l) => l.status === "active") ?? languages[0])?.id ?? 0,
                title: navValue.label.trim() || values.speciality_title || values.speciality_name,
                sorting_order: navValue.sortingOrder === "" ? 0 : Number(navValue.sortingOrder),
                parent:
                  navValue.parentSelection === NAV_TOP_LEVEL_VALUE
                    ? { mode: "top_level" as const, placement: navValue.placement }
                    : navValue.parentSelection === NAV_NEW_PARENT_VALUE
                      ? { mode: "new_parent" as const, title: navValue.newParentTitle, placement: navValue.placement }
                      : { mode: "existing" as const, parent_id: Number(navValue.parentSelection) },
              };
          await setGlobalSpecialityNavigation(result.globalSpeciality.id, navInput);
        } catch {
          navSyncFailed = true;
        }
      }

      return { ...result, faqSyncFailed, navSyncFailed };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: globalSpecialitiesKeys.all });
      queryClient.invalidateQueries({ queryKey: globalSpecialityFaqsKeys.byGlobalSpeciality(data.globalSpeciality.id) });
      queryClient.invalidateQueries({ queryKey: globalSpecialityNavigationKeys.byGlobalSpeciality(data.globalSpeciality.id) });
      queryClient.invalidateQueries({ queryKey: menusKeys.parentOptionsGlobal() });

      const warnings: string[] = [];
      if (data.faqSyncFailed) warnings.push("some FAQ changes failed to save");
      if (data.navSyncFailed) warnings.push("the navigation configuration failed to save");

      if (!liveGlobalSpeciality) {
        setLiveGlobalSpeciality(data.globalSpeciality);
        onCreated();
        if (warnings.length > 0) {
          setActiveTab(data.faqSyncFailed ? "faqs" : "basic");
          notify.warning(`Global speciality created, but ${warnings.join(" and ")} — please review and try again.`);
        } else {
          setActiveTab("content");
          notify.success("Global speciality created. Configure its sections below whenever you're ready.");
        }
        return;
      }

      if (warnings.length > 0) {
        setActiveTab(data.faqSyncFailed ? "faqs" : "basic");
        notify.warning(`Global speciality updated, but ${warnings.join(" and ")} — please review and try again.`);
        return;
      }

      notify.success("Global speciality updated successfully.");
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: GlobalSpecialityFormValues) => {
    // Not zod-validated (navigation isn't part of globalSpecialityFormSchema
    // — see the state block above) — checked by hand here so this one
    // invalid combination can't silently waste a round-trip to the API.
    if (navValue.showInNav && navValue.parentSelection === NAV_NEW_PARENT_VALUE && navValue.newParentTitle.trim() === "") {
      setActiveTab("basic");
      notify.error("Enter a title for the new parent menu, or choose a different Parent menu option.");
      return;
    }
    mutation.mutate(values);
  };

  // Fires when zodResolver rejects the submission — switches to the first
  // tab containing an invalid field (so its FieldError actually becomes
  // visible) and surfaces a toast, rather than leaving the admin staring
  // at a button click that visibly did nothing. See FIELD_TABS above.
  const onInvalid = (formErrors: typeof errors) => {
    const firstInvalidField = Object.keys(formErrors)[0] as keyof GlobalSpecialityFormValues | undefined;
    const tabWithError = firstInvalidField ? FIELD_TABS[firstInvalidField] : undefined;
    if (tabWithError) setActiveTab(tabWithError);
    notify.error("Please fix the highlighted fields before submitting.");
  };

  const saveLabel = liveGlobalSpeciality ? "Save Changes" : "Create Global Speciality";
  const cancelLabel = liveGlobalSpeciality ? "Close" : "Cancel";

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="flex min-w-0 flex-col">
      <div className="max-h-[60vh] overflow-y-auto pr-1">
        {mutation.isError && (
          <div role="alert" className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {mutation.error instanceof ApiError ? mutation.error.message : "Something went wrong."}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
          <TabsList className="sticky top-0 z-10 -mt-1 grid w-full grid-cols-4 bg-popover pt-1 pb-2">
            <TabsTrigger value="basic" className="min-w-0">
              <span className="truncate">Basic</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="min-w-0">
              <span className="truncate">Content</span>
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
                Global Speciality Information
              </FieldLegend>
              <p className="text-helper">
                City-independent content shown at <code>/dcg/speciality/{"{seoUrl}"}</code> — no city, hospital, or location here by
                design.
              </p>
              <FormFieldGrid>
                <Field className="sm:col-span-2" data-invalid={!!errors.speciality_name || undefined}>
                  <FieldLabel htmlFor="global-speciality-name">
                    Speciality Name <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input id="global-speciality-name" aria-invalid={!!errors.speciality_name || undefined} {...register("speciality_name")} />
                  <FieldError errors={[errors.speciality_name]} />
                </Field>

                <Field data-invalid={!!errors.speciality_title || undefined}>
                  <FieldLabel htmlFor="global-speciality-title">
                    Speciality Title <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Input id="global-speciality-title" {...register("speciality_title")} />
                  <FieldError errors={[errors.speciality_title]} />
                </Field>

                <Field data-invalid={!!errors.status || undefined}>
                  <FieldLabel htmlFor="global-speciality-status">Status</FieldLabel>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="global-speciality-status" className="w-full">
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

                <Field className="sm:col-span-2">
                  <FieldLabel>
                    Image <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  {liveGlobalSpeciality?.image && !imageRemoved && imageFiles.length === 0 && (
                    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                      {/* eslint-disable-next-line @next/next/no-img-element -- small preview of the currently stored image. */}
                      <img src={liveGlobalSpeciality.image} alt="" className="size-10 shrink-0 rounded-md border border-border object-contain" />
                      <span className="flex-1 text-body-sm text-muted-foreground">Current image — upload a new file to replace it.</span>
                      <button
                        type="button"
                        onClick={() => setImageRemoved(true)}
                        disabled={mutation.isPending}
                        className="shrink-0 text-body-sm font-medium text-destructive hover:underline disabled:pointer-events-none disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  <FileUploadArea
                    files={imageFiles}
                    onFilesChange={(files) => {
                      setImageFiles(files);
                      if (files.length > 0) setImageRemoved(false);
                    }}
                    accept={IMAGE_ACCEPT}
                    hint={IMAGE_HINT}
                    disabled={mutation.isPending}
                  />
                </Field>

                <TreatmentImageField
                  label="Speciality Card Icon"
                  description="Small square icon or transparent image shown on speciality listing cards. If empty, a default icon is used — the hero image is never used here."
                  currentUrl={liveGlobalSpeciality?.card_icon}
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
              <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
                Description
              </FieldLegend>
              <FormFieldGrid>
                <Field className="sm:col-span-2" data-invalid={!!errors.short_description || undefined}>
                  <FieldLabel htmlFor="global-speciality-short-description">
                    Short Description <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Textarea id="global-speciality-short-description" rows={3} {...register("short_description")} />
                  <FieldError errors={[errors.short_description]} />
                </Field>

                <Field className="sm:col-span-2" data-invalid={!!errors.description || undefined}>
                  <FieldLabel htmlFor="global-speciality-description">
                    Description <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <RichTextEditor
                        id="global-speciality-description"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="Start writing the global content for this speciality..."
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
                Navigation
              </FieldLegend>
              <p className="text-helper">Control whether and where this speciality appears in the public site&apos;s navigation.</p>
              <GlobalSpecialityNavigationFields
                value={navValue}
                onChange={(patch) => setNavValue((prev) => ({ ...prev, ...patch }))}
                disabled={mutation.isPending}
                destinationUrl={navDestinationUrl}
                fallbackLabel={navFallbackLabel}
                parentOptions={navParentOptions}
                parentOptionsLoading={parentMenusQuery.isLoading}
                allGlobalMenus={allGlobalMenus}
                canView={canViewNav}
                canEdit={canEditNav}
              />
            </FieldSet>
          </TabsContent>

          <TabsContent value="content" className="pt-1">
            {liveGlobalSpeciality ? (
              <GlobalSpecialitySectionsPanel globalSpecialityId={liveGlobalSpeciality.id} />
            ) : (
              <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-body-sm text-muted-foreground">
                Fill in Basic information and save — you&apos;ll land right back here, ready to configure sections, with
                no need to reopen this dialog.
              </p>
            )}
          </TabsContent>

          <TabsContent value="faqs" className="flex flex-col gap-5 pt-1">
            <FieldSet>
              <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
                FAQs
              </FieldLegend>
              <p className="text-helper">Add frequently asked questions for this global speciality.</p>
              {liveGlobalSpeciality && !faqsInitialized && faqsQuery.isLoading ? (
                <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Loading FAQs…
                </div>
              ) : (
                <GlobalSpecialityFaqsEditor faqs={faqs} onChange={setFaqs} disabled={mutation.isPending} />
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
                  <FieldLabel htmlFor="global-speciality-seo-url">
                    SEO URL <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input id="global-speciality-seo-url" aria-invalid={!!errors.seo_url || undefined} {...register("seo_url")} />
                  <p className="text-helper">
                    Becomes <code>/dcg/speciality/{"{value}"}</code> — must be unique across both global treatments and global
                    specialities.
                  </p>
                  <FieldError errors={[errors.seo_url]} />
                </Field>

                <Field data-invalid={!!errors.meta_title || undefined}>
                  <FieldLabel htmlFor="global-speciality-meta-title">
                    Meta Title <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Input id="global-speciality-meta-title" {...register("meta_title")} />
                  <FieldError errors={[errors.meta_title]} />
                </Field>

                <Field data-invalid={!!errors.meta_keyword || undefined}>
                  <FieldLabel htmlFor="global-speciality-meta-keyword">
                    Meta Keyword <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Input id="global-speciality-meta-keyword" {...register("meta_keyword")} />
                  <FieldError errors={[errors.meta_keyword]} />
                </Field>

                <Field className="sm:col-span-2" data-invalid={!!errors.meta_description || undefined}>
                  <FieldLabel htmlFor="global-speciality-meta-description">
                    Meta Description <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Textarea id="global-speciality-meta-description" rows={3} {...register("meta_description")} />
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
        <LoadingButton type="submit" disabled={isSubmitting} loading={mutation.isPending}>
          {saveLabel}
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
