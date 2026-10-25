"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/admin/FormDialog";
import { FormFieldGrid } from "@/components/admin/FormFieldGrid";
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
import { GlobalTreatmentSectionsPanel } from "@/components/admin/global-treatments/GlobalTreatmentSectionsPanel";
import { GlobalTreatmentFaqsEditor, type GlobalTreatmentFaqDraft } from "@/components/admin/global-treatments/GlobalTreatmentFaqsEditor";
import { ApiError } from "@/lib/api/client";
import { createGlobalTreatment, getGlobalTreatment, updateGlobalTreatment } from "@/lib/api/global-treatments";
import { listGlobalSpecialities } from "@/lib/api/global-specialities";
import {
  createGlobalTreatmentFaq,
  deleteGlobalTreatmentFaq,
  listGlobalTreatmentFaqs,
  updateGlobalTreatmentFaq,
} from "@/lib/api/global-treatment-faqs";
import { notify } from "@/lib/toast";
import { globalTreatmentFaqsKeys, globalTreatmentsKeys } from "@/components/admin/global-treatments/queries";
import { globalSpecialitiesKeys } from "@/components/admin/global-specialities/queries";
import type { GlobalTreatment } from "@/types/global-treatment";

const NO_GLOBAL_SPECIALITY_VALUE = "none";
type TabValue = "basic" | "content" | "faqs" | "seo";

/** Mirrors validators/global-treatment.validator.ts's createGlobalTreatmentSchema — `image` is handled separately as File state (multipart, not part of this JSON-shaped RHF schema). Deliberately has NO city/hospital/location fields — a global treatment is city-independent by design; `global_speciality_id` is the one exception, since `global_specialities` is ALSO city-independent (see the schema's own doc comment on that column). */
const globalTreatmentFormSchema = z.object({
  treatment_name: z.string().trim().min(1, "Treatment name is required").max(255, "Name is too long"),
  treatment_title: z.string().trim().max(255, "Title is too long").optional(),
  seo_url: z
    .string()
    .trim()
    .min(1, "SEO URL is required")
    .max(255, "SEO URL is too long")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens only (no spaces)"),
  short_description: z.string().trim().optional(),
  description: z.string().optional(),
  meta_title: z.string().trim().max(255, "Meta title is too long").optional(),
  meta_keyword: z.string().trim().max(500, "Meta keyword is too long").optional(),
  meta_description: z.string().trim().optional(),
  global_speciality_id: z.string(),
  status: z.enum(["active", "inactive"]),
});

type GlobalTreatmentFormValues = z.infer<typeof globalTreatmentFormSchema>;

type GlobalTreatmentFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  globalTreatmentId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function GlobalTreatmentFormDialog({ open, mode, globalTreatmentId, onOpenChange }: GlobalTreatmentFormDialogProps) {
  const [justCreated, setJustCreated] = useState(false);
  const effectiveMode = justCreated ? "edit" : mode;

  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setJustCreated(false);
        onOpenChange(next);
      }}
      title={effectiveMode === "create" ? "Add Global Treatment" : "Edit Global Treatment"}
      description={
        effectiveMode === "create"
          ? "Create a new global treatment, then configure its content without leaving this window."
          : "Update this global treatment's content and SEO."
      }
      className="sm:max-w-3xl"
    >
      {open && (
        <GlobalTreatmentFormBody
          key={mode === "edit" ? (globalTreatmentId ?? "edit") : "create"}
          mode={mode}
          globalTreatmentId={globalTreatmentId}
          onCreated={() => setJustCreated(true)}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function GlobalTreatmentFormBody({
  mode,
  globalTreatmentId,
  onCreated,
  onOpenChange,
}: {
  mode: "create" | "edit";
  globalTreatmentId: number | null;
  onCreated: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const globalTreatmentQuery = useQuery({
    queryKey: globalTreatmentsKeys.detail(globalTreatmentId ?? -1),
    queryFn: () => getGlobalTreatment(globalTreatmentId as number),
    enabled: mode === "edit" && globalTreatmentId !== null,
  });

  if (mode === "edit" && globalTreatmentQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading global treatment…
      </div>
    );
  }

  if (mode === "edit" && globalTreatmentQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {globalTreatmentQuery.error instanceof ApiError ? globalTreatmentQuery.error.message : "Failed to load global treatment."}
      </p>
    );
  }

  return (
    <GlobalTreatmentForm
      mode={mode}
      initialGlobalTreatment={globalTreatmentQuery.data?.globalTreatment}
      onCreated={onCreated}
      onOpenChange={onOpenChange}
    />
  );
}

function GlobalTreatmentForm({
  mode,
  initialGlobalTreatment,
  onCreated,
  onOpenChange,
}: {
  mode: "create" | "edit";
  initialGlobalTreatment?: GlobalTreatment;
  onCreated: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const [liveGlobalTreatment, setLiveGlobalTreatment] = useState<GlobalTreatment | undefined>(initialGlobalTreatment);
  const [activeTab, setActiveTab] = useState<TabValue>(mode === "edit" ? "content" : "basic");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<GlobalTreatmentFormValues>({
    resolver: zodResolver(globalTreatmentFormSchema),
    defaultValues: {
      treatment_name: initialGlobalTreatment?.treatment_name ?? "",
      treatment_title: initialGlobalTreatment?.treatment_title ?? "",
      seo_url: initialGlobalTreatment?.seo_url ?? "",
      short_description: initialGlobalTreatment?.short_description ?? "",
      description: initialGlobalTreatment?.description ?? "",
      meta_title: initialGlobalTreatment?.meta_title ?? "",
      meta_keyword: initialGlobalTreatment?.meta_keyword ?? "",
      meta_description: initialGlobalTreatment?.meta_description ?? "",
      global_speciality_id: initialGlobalTreatment?.global_speciality_id
        ? String(initialGlobalTreatment.global_speciality_id)
        : NO_GLOBAL_SPECIALITY_VALUE,
      status: initialGlobalTreatment?.status === "inactive" ? "inactive" : "active",
    },
  });

  const globalSpecialityOptionsQuery = useQuery({
    queryKey: globalSpecialitiesKeys.active,
    queryFn: () => listGlobalSpecialities({ status: "active" }),
  });
  const globalSpecialityOptions = globalSpecialityOptionsQuery.data?.globalSpecialities ?? [];

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [cardIconFiles, setCardIconFiles] = useState<File[]>([]);
  const [cardIconRemoved, setCardIconRemoved] = useState(false);

  const [faqs, setFaqs] = useState<GlobalTreatmentFaqDraft[]>([]);
  const [originalFaqIds, setOriginalFaqIds] = useState<number[]>([]);
  const [faqsInitialized, setFaqsInitialized] = useState(false);

  const faqsQuery = useQuery({
    queryKey: globalTreatmentFaqsKeys.byGlobalTreatment(liveGlobalTreatment?.id ?? -1),
    queryFn: () => listGlobalTreatmentFaqs(liveGlobalTreatment?.id as number),
    enabled: !!liveGlobalTreatment,
  });

  if (liveGlobalTreatment && !faqsInitialized && faqsQuery.data) {
    const loaded: GlobalTreatmentFaqDraft[] = faqsQuery.data.globalTreatmentFaqs.map((faq) => ({
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

  const mutation = useMutation({
    mutationFn: async (values: GlobalTreatmentFormValues) => {
      const payload = {
        treatment_name: values.treatment_name,
        treatment_title: values.treatment_title ? values.treatment_title : null,
        seo_url: values.seo_url,
        short_description: values.short_description ? values.short_description : null,
        description: values.description ? values.description : null,
        meta_title: values.meta_title ? values.meta_title : null,
        meta_keyword: values.meta_keyword ? values.meta_keyword : null,
        meta_description: values.meta_description ? values.meta_description : null,
        global_speciality_id:
          values.global_speciality_id === NO_GLOBAL_SPECIALITY_VALUE ? null : Number(values.global_speciality_id),
        status: values.status,
      };
      const image = imageFiles.length > 0 ? imageFiles[0] : imageRemoved ? null : undefined;
      const cardIcon = cardIconFiles.length > 0 ? cardIconFiles[0] : cardIconRemoved ? null : undefined;
      const result = liveGlobalTreatment
        ? await updateGlobalTreatment(liveGlobalTreatment.id, payload, image, cardIcon)
        : await createGlobalTreatment(payload, image, cardIcon);

      const currentIds = faqs.filter((faq) => faq.id !== null).map((faq) => faq.id as number);
      const toDelete = originalFaqIds.filter((id) => !currentIds.includes(id));

      await Promise.all([
        ...faqs.map((faq) =>
          faq.id === null
            ? createGlobalTreatmentFaq({
                global_treatment_id: result.globalTreatment.id,
                title: faq.title,
                text: faq.text,
                status: faq.status,
              })
            : updateGlobalTreatmentFaq(faq.id, { title: faq.title, text: faq.text, status: faq.status })
        ),
        ...toDelete.map((id) => deleteGlobalTreatmentFaq(id)),
      ]);

      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: globalTreatmentsKeys.all });
      queryClient.invalidateQueries({ queryKey: globalTreatmentFaqsKeys.byGlobalTreatment(data.globalTreatment.id) });

      if (!liveGlobalTreatment) {
        setLiveGlobalTreatment(data.globalTreatment);
        setActiveTab("content");
        onCreated();
        notify.success("Global treatment created. Configure its sections below whenever you're ready.");
        return;
      }

      notify.success("Global treatment updated successfully.");
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: GlobalTreatmentFormValues) => {
    mutation.mutate(values);
  };

  const saveLabel = liveGlobalTreatment ? "Save Changes" : "Create Global Treatment";
  const cancelLabel = liveGlobalTreatment ? "Close" : "Cancel";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex min-w-0 flex-col">
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
                Global Treatment Information
              </FieldLegend>
              <p className="text-helper">
                City-independent content shown at <code>/dcg/treatment/{"{seoUrl}"}</code> — no city, hospital, or location here by
                design.
              </p>
              <FormFieldGrid>
                <Field className="sm:col-span-2" data-invalid={!!errors.treatment_name || undefined}>
                  <FieldLabel htmlFor="global-treatment-name">
                    Treatment Name <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input id="global-treatment-name" aria-invalid={!!errors.treatment_name || undefined} {...register("treatment_name")} />
                  <FieldError errors={[errors.treatment_name]} />
                </Field>

                <Field data-invalid={!!errors.treatment_title || undefined}>
                  <FieldLabel htmlFor="global-treatment-title">
                    Treatment Title <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Input id="global-treatment-title" {...register("treatment_title")} />
                  <FieldError errors={[errors.treatment_title]} />
                </Field>

                <Field data-invalid={!!errors.global_speciality_id || undefined}>
                  <FieldLabel htmlFor="global-treatment-global-speciality">
                    Global Speciality <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Controller
                    name="global_speciality_id"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={globalSpecialityOptionsQuery.isLoading}
                      >
                        <SelectTrigger id="global-treatment-global-speciality" className="w-full">
                          <SelectValue
                            placeholder={globalSpecialityOptionsQuery.isLoading ? "Loading…" : "None"}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_GLOBAL_SPECIALITY_VALUE}>None</SelectItem>
                          {globalSpecialityOptions.map((speciality) => (
                            <SelectItem key={speciality.id} value={String(speciality.id)}>
                              {speciality.speciality_title || speciality.speciality_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <p className="text-helper">
                    The treatment always lives at <code>/dcg/treatment/{"{seoUrl}"}</code>; this link only lists it under that
                    speciality (Related Treatments, navigation). Old <code>/dcg/{"{speciality}"}/{"{treatment}"}</code> and{" "}
                    <code>/dcg/{"{treatment}"}</code> links redirect to the current URL automatically.
                  </p>
                  <FieldError errors={[errors.global_speciality_id]} />
                </Field>

                <Field data-invalid={!!errors.status || undefined}>
                  <FieldLabel htmlFor="global-treatment-status">Status</FieldLabel>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="global-treatment-status" className="w-full">
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

                <TreatmentImageField
                  label="Hero Image"
                  description="Large banner shown at the top of this treatment's detail page."
                  currentUrl={liveGlobalTreatment?.image}
                  files={imageFiles}
                  onFilesChange={(files) => {
                    setImageFiles(files);
                    if (files.length > 0) setImageRemoved(false);
                  }}
                  removed={imageRemoved}
                  onRemove={() => setImageRemoved(true)}
                  disabled={mutation.isPending}
                />

                <TreatmentImageField
                  label="Treatment Card Icon"
                  description="Small square icon or transparent image shown on treatment listing cards. If empty, a default icon is used — the hero image is never used here."
                  currentUrl={liveGlobalTreatment?.card_icon}
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
                  <FieldLabel htmlFor="global-treatment-short-description">
                    Short Description <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Textarea id="global-treatment-short-description" rows={3} {...register("short_description")} />
                  <FieldError errors={[errors.short_description]} />
                </Field>

                <Field className="sm:col-span-2" data-invalid={!!errors.description || undefined}>
                  <FieldLabel htmlFor="global-treatment-description">
                    Description <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <RichTextEditor
                        id="global-treatment-description"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="Start writing the global content for this treatment..."
                        error={!!errors.description}
                      />
                    )}
                  />
                  <FieldError errors={[errors.description]} />
                </Field>
              </FormFieldGrid>
            </FieldSet>
          </TabsContent>

          <TabsContent value="content" className="pt-1">
            {liveGlobalTreatment ? (
              <GlobalTreatmentSectionsPanel globalTreatmentId={liveGlobalTreatment.id} />
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
              <p className="text-helper">Add frequently asked questions for this global treatment.</p>
              {liveGlobalTreatment && !faqsInitialized && faqsQuery.isLoading ? (
                <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Loading FAQs…
                </div>
              ) : (
                <GlobalTreatmentFaqsEditor faqs={faqs} onChange={setFaqs} disabled={mutation.isPending} />
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
                  <FieldLabel htmlFor="global-treatment-seo-url">
                    SEO URL <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input id="global-treatment-seo-url" aria-invalid={!!errors.seo_url || undefined} {...register("seo_url")} />
                  <p className="text-helper">
                    Becomes <code>/dcg/treatment/{"{value}"}</code> — must be unique across both global treatments and global
                    specialities.
                  </p>
                  <FieldError errors={[errors.seo_url]} />
                </Field>

                <Field data-invalid={!!errors.meta_title || undefined}>
                  <FieldLabel htmlFor="global-treatment-meta-title">
                    Meta Title <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Input id="global-treatment-meta-title" {...register("meta_title")} />
                  <FieldError errors={[errors.meta_title]} />
                </Field>

                <Field data-invalid={!!errors.meta_keyword || undefined}>
                  <FieldLabel htmlFor="global-treatment-meta-keyword">
                    Meta Keyword <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Input id="global-treatment-meta-keyword" {...register("meta_keyword")} />
                  <FieldError errors={[errors.meta_keyword]} />
                </Field>

                <Field className="sm:col-span-2" data-invalid={!!errors.meta_description || undefined}>
                  <FieldLabel htmlFor="global-treatment-meta-description">
                    Meta Description <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Textarea id="global-treatment-meta-description" rows={3} {...register("meta_description")} />
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
