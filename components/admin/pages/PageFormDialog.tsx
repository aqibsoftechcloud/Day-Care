"use client";

import { useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RichTextEditor } from "@/components/admin/editor/RichTextEditor";
import { PageSectionsPanel } from "@/components/admin/pages/PageSectionsPanel";
import { ApiError } from "@/lib/api/client";
import { createPage, getPage, updatePage } from "@/lib/api/pages";
import { listLanguages } from "@/lib/api/languages";
import { listCities } from "@/lib/api/cities";
import { listLocations } from "@/lib/api/locations";
import { notify } from "@/lib/toast";
import { pagesKeys } from "@/components/admin/pages/queries";
import { languagesKeys } from "@/components/admin/languages/queries";
import { citiesKeys } from "@/components/admin/cities/queries";
import { locationsKeys } from "@/components/admin/locations/queries";
import type { Page } from "@/types/page";

const NO_LOCATION_VALUE = "none";
type TabValue = "details" | "sections" | "seo";

// Mirrors validators/page.validator.ts's createPageSchema exactly — note
// the singular "meta_keyword" field name (differs from other modules).
const pageFormSchema = z
  .object({
  title: z.string().trim().min(1, "Title is required").max(255, "Title is too long"),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255, "SEO URL is too long"),
  language_id: z.string().min(1, "Language is required"),
  scope: z.enum(["global", "city"], { message: "Page type is required" }),
  city_id: z.string(),
  location_id: z.string(),
  category: z.string().trim().min(1, "Category is required").max(100, "Category is too long"),
  body: z.string().optional(),
  meta_title: z.string().trim().max(255, "Meta title is too long").optional(),
  meta_description: z.string().trim().optional(),
  meta_keyword: z.string().trim().max(500, "Meta keyword is too long").optional(),
  status: z.enum(["active", "inactive"]),
  footer_placement: z.enum(["company", "legal", "hidden"]),
  })
  .superRefine((values, ctx) => {
    if (values.scope === "city" && !values.city_id) {
      ctx.addIssue({ code: "custom", path: ["city_id"], message: "City is required for a city-specific page" });
    }
  });

type PageFormValues = z.infer<typeof pageFormSchema>;

type PageFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  pageId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function PageFormDialog({ open, mode, pageId, onOpenChange }: PageFormDialogProps) {
  // Flips once a *create* session saves successfully, so the dialog's own
  // title/description read as "Edit Page" for the rest of that session —
  // the form itself (see PageForm) has already seamlessly moved from
  // "creating" to "editing this new page" without closing/reopening.
  const [justCreated, setJustCreated] = useState(false);
  const effectiveMode = justCreated ? "edit" : mode;

  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setJustCreated(false);
        onOpenChange(next);
      }}
      title={effectiveMode === "create" ? "Add Page" : "Edit Page"}
      description={
        effectiveMode === "create"
          ? "Create a new page, then add structured sections without leaving this window."
          : "Update this page's details, sections, and SEO."
      }
      className="sm:max-w-3xl"
    >
      {open && (
        <PageFormBody
          key={mode === "edit" ? (pageId ?? "edit") : "create"}
          mode={mode}
          pageId={pageId}
          onCreated={() => setJustCreated(true)}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function PageFormBody({
  mode,
  pageId,
  onCreated,
  onOpenChange,
}: {
  mode: "create" | "edit";
  pageId: number | null;
  onCreated: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const pageQuery = useQuery({
    queryKey: pagesKeys.detail(pageId ?? -1),
    queryFn: () => getPage(pageId as number),
    enabled: mode === "edit" && pageId !== null,
  });

  if (mode === "edit" && pageQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading page…
      </div>
    );
  }

  if (mode === "edit" && pageQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {pageQuery.error instanceof ApiError ? pageQuery.error.message : "Failed to load page."}
      </p>
    );
  }

  return (
    <PageForm mode={mode} initialPage={pageQuery.data?.page} onCreated={onCreated} onOpenChange={onOpenChange} />
  );
}

function PageForm({
  mode,
  initialPage,
  onCreated,
  onOpenChange,
}: {
  mode: "create" | "edit";
  initialPage?: Page;
  onCreated: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  // `livePage` is the source of truth for "does a real, saved page exist
  // to attach sections to right now" — present from the start in edit
  // mode (`initialPage`), or set the moment a create-mutation succeeds
  // (see `mutation.onSuccess` below), whichever comes first. Everything
  // that used to key off the static `mode` prop (Sections tab, footer
  // button labels, which endpoint to call) keys off this instead, so a
  // create session can turn into a live edit session in place.
  const [livePage, setLivePage] = useState<Page | undefined>(initialPage);
  const [activeTab, setActiveTab] = useState<TabValue>(mode === "edit" ? "sections" : "details");

  const languagesQuery = useQuery({ queryKey: languagesKeys.all, queryFn: listLanguages });
  const citiesQuery = useQuery({ queryKey: citiesKeys.all, queryFn: listCities });
  const locationsQuery = useQuery({ queryKey: locationsKeys.all, queryFn: listLocations });

  const languages = languagesQuery.data?.languages ?? [];
  const cities = citiesQuery.data?.cities ?? [];
  const allLocations = useMemo(() => locationsQuery.data?.locations ?? [], [locationsQuery.data]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PageFormValues>({
    resolver: zodResolver(pageFormSchema),
    defaultValues: {
      title: initialPage?.title ?? "",
      seo_url: initialPage?.seo_url ?? "",
      language_id: initialPage ? String(initialPage.language_id) : "",
      // New pages start with NO page type chosen, so scope is always a deliberate decision.
      // (cast: "" is the unselected state; the schema rejects it with "Page type is required")
      scope: (initialPage?.scope ?? "") as "global" | "city",
      city_id: initialPage?.city_id ? String(initialPage.city_id) : "",
      location_id: initialPage?.location_id ? String(initialPage.location_id) : NO_LOCATION_VALUE,
      category: initialPage?.category ?? "",
      body: initialPage?.body ?? "",
      meta_title: initialPage?.meta_title ?? "",
      meta_description: initialPage?.meta_description ?? "",
      meta_keyword: initialPage?.meta_keyword ?? "",
      status: initialPage?.status === "inactive" ? "inactive" : "active",
      footer_placement: initialPage?.footer_placement ?? "company",
    },
  });

  const selectedScope = watch("scope");
  const isCityPage = selectedScope === "city";
  const selectedCityId = isCityPage ? watch("city_id") : "";
  const watchedTitle = watch("title");
  const watchedMetaTitle = watch("meta_title");
  const watchedMetaDescription = watch("meta_description");
  const watchedSeoUrl = watch("seo_url");

  // A location must belong to the selected city — filter the choices for a
  // clearer UX, but the backend still authoritatively re-validates this.
  const locationOptions = useMemo(
    () => allLocations.filter((location) => String(location.city_id) === selectedCityId),
    [allLocations, selectedCityId]
  );

  const mutation = useMutation({
    mutationFn: async (values: PageFormValues) => {
      const payload = {
        title: values.title,
        seo_url: values.seo_url,
        language_id: Number(values.language_id),
        scope: values.scope,
        // A global page never carries a city or a location.
        city_id: values.scope === "city" ? Number(values.city_id) : null,
        location_id: values.scope === "city" && values.location_id !== NO_LOCATION_VALUE ? Number(values.location_id) : null,
        category: values.category,
        body: values.body ? values.body : null,
        meta_title: values.meta_title ? values.meta_title : null,
        meta_description: values.meta_description ? values.meta_description : null,
        meta_keyword: values.meta_keyword ? values.meta_keyword : null,
        status: values.status,
        footer_placement: values.footer_placement,
      };
      if (livePage) {
        return updatePage(livePage.id, payload);
      }
      return createPage(payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: pagesKeys.all });

      if (!livePage) {
        // This was a create — stay open, move into a live edit session for
        // the page that just got created, and jump straight to Sections
        // instead of making the admin close and reopen the dialog.
        setLivePage(data.page);
        setActiveTab("sections");
        onCreated();
        notify.success("Page created. Add sections below whenever you're ready.");
        return;
      }

      notify.success("Page updated successfully.");
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: PageFormValues) => {
    mutation.mutate(values);
  };

  const saveLabel = livePage ? "Save Changes" : "Create Page";
  const cancelLabel = livePage ? "Close" : "Cancel";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col">
      {/*
        The scrollable middle region is bounded to its own max-height so
        the footer below it sits in normal flow instead of needing
        `position: sticky` — sticky here previously combined with the
        shared DialogFooter's negative bottom margin (used to bleed it to
        the dialog's rounded corners) in a way that visually overlapped
        and intercepted clicks on whatever content sat directly above it
        (e.g. the Sections tab's "Add Section" button). This layout
        avoids that interaction entirely: only this inner div scrolls,
        the footer never overlaps it.
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
          <TabsList className="sticky top-0 z-10 -mt-1 grid w-full grid-cols-3 bg-popover pt-1 pb-2">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="flex flex-col gap-5 pt-1">
          <FieldSet>
            <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
              Page Information
            </FieldLegend>
            <FormFieldGrid>
              <Field className="sm:col-span-2" data-invalid={!!errors.title || undefined}>
                <FieldLabel htmlFor="page-title">
                  Title <span className="text-destructive">*</span>
                </FieldLabel>
                <Input id="page-title" aria-invalid={!!errors.title || undefined} {...register("title")} />
                <FieldError errors={[errors.title]} />
              </Field>

              <Field data-invalid={!!errors.category || undefined}>
                <FieldLabel htmlFor="page-category">
                  Category <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="page-category"
                  placeholder="e.g. General"
                  aria-invalid={!!errors.category || undefined}
                  {...register("category")}
                />
                <FieldError errors={[errors.category]} />
              </Field>

              <Field data-invalid={!!errors.language_id || undefined}>
                <FieldLabel htmlFor="page-language">
                  Language <span className="text-destructive">*</span>
                </FieldLabel>
                <Controller
                  name="language_id"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={languagesQuery.isLoading}>
                      <SelectTrigger id="page-language" className="w-full">
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

              <Field data-invalid={!!errors.scope || undefined}>
                <FieldLabel htmlFor="page-scope">
                  Page Type <span className="text-destructive">*</span>
                </FieldLabel>
                <Controller
                  name="scope"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value === "global") {
                          setValue("city_id", "");
                          setValue("location_id", NO_LOCATION_VALUE);
                        }
                      }}
                    >
                      <SelectTrigger id="page-scope" className="w-full">
                        <SelectValue placeholder="Select page type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global">Global Page</SelectItem>
                        <SelectItem value="city">City-Specific Page</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.scope]} />
              </Field>

              {isCityPage && (
              <>
              <Field data-invalid={!!errors.city_id || undefined}>
                <FieldLabel htmlFor="page-city">
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
                      <SelectTrigger id="page-city" className="w-full">
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
                <FieldLabel htmlFor="page-location">Location</FieldLabel>
                <Controller
                  name="location_id"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={!selectedCityId}>
                      <SelectTrigger id="page-location" className="w-full">
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
              </>
              )}

              <Field data-invalid={!!errors.status || undefined}>
                <FieldLabel htmlFor="page-status">Status</FieldLabel>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="page-status" className="w-full">
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

              <Field data-invalid={!!errors.footer_placement || undefined}>
                <FieldLabel htmlFor="page-footer-placement">Footer placement</FieldLabel>
                <Controller
                  name="footer_placement"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="page-footer-placement" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="company">Company links (footer column)</SelectItem>
                        <SelectItem value="legal">Legal links (bottom bar)</SelectItem>
                        <SelectItem value="hidden">Don&apos;t list in the footer</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.footer_placement]} />
              </Field>
            </FormFieldGrid>
          </FieldSet>

          <Accordion type="single" collapsible>
            <AccordionItem value="legacy-body" className="rounded-lg border border-border px-4">
              <AccordionTrigger className="text-[13px] font-semibold text-foreground hover:no-underline">
                Advanced: Legacy Content
              </AccordionTrigger>
              <AccordionContent>
                <p className="mb-3 text-body-sm text-muted-foreground">
                  This content is used only when the page has no active structured sections. New pages should use the
                  Sections tab instead.
                </p>
                <Field data-invalid={!!errors.body || undefined}>
                  <FieldLabel htmlFor="page-body">
                    Body <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Controller
                    name="body"
                    control={control}
                    render={({ field }) => (
                      <RichTextEditor
                        id="page-body"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="Start writing your page content..."
                        error={!!errors.body}
                      />
                    )}
                  />
                  <FieldError errors={[errors.body]} />
                </Field>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        <TabsContent value="sections" className="pt-1">
          {livePage ? (
            <PageSectionsPanel pageId={livePage.id} />
          ) : (
            <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-body-sm text-muted-foreground">
              Fill in the Page Information tab and save — you&apos;ll land right back here, ready to add sections,
              with no need to reopen this dialog.
            </p>
          )}
        </TabsContent>

        <TabsContent value="seo" className="flex flex-col gap-5 pt-1">
          <FieldSet>
            <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
              SEO Settings
            </FieldLegend>
            <FormFieldGrid>
              <Field className="sm:col-span-2" data-invalid={!!errors.seo_url || undefined}>
                <FieldLabel htmlFor="page-seo-url">
                  SEO URL <span className="text-destructive">*</span>
                </FieldLabel>
                <Input id="page-seo-url" aria-invalid={!!errors.seo_url || undefined} {...register("seo_url")} />
                <FieldError errors={[errors.seo_url]} />
              </Field>

              <Field data-invalid={!!errors.meta_title || undefined}>
                <FieldLabel htmlFor="page-meta-title">
                  Meta Title <span className="text-muted-foreground">(optional)</span>
                </FieldLabel>
                <Input id="page-meta-title" {...register("meta_title")} />
                <FieldError errors={[errors.meta_title]} />
              </Field>

              <Field data-invalid={!!errors.meta_keyword || undefined}>
                <FieldLabel htmlFor="page-meta-keyword">
                  Meta Keyword <span className="text-muted-foreground">(optional)</span>
                </FieldLabel>
                <Input id="page-meta-keyword" {...register("meta_keyword")} />
                <FieldError errors={[errors.meta_keyword]} />
              </Field>

              <Field className="sm:col-span-2" data-invalid={!!errors.meta_description || undefined}>
                <FieldLabel htmlFor="page-meta-description">
                  Meta Description <span className="text-muted-foreground">(optional)</span>
                </FieldLabel>
                <Textarea id="page-meta-description" rows={3} {...register("meta_description")} />
                <FieldError errors={[errors.meta_description]} />
              </Field>
            </FormFieldGrid>
          </FieldSet>

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
              <Search className="size-3.5 text-muted-foreground" aria-hidden="true" />
              Search Preview
            </p>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="truncate text-body-sm text-muted-foreground">/{watchedSeoUrl || "page-url"}</p>
              <p className="mt-0.5 truncate text-[17px] leading-snug text-primary">
                {watchedMetaTitle || watchedTitle || "Page title"}
              </p>
              <p className="mt-0.5 line-clamp-2 text-body-sm text-muted-foreground">
                {watchedMetaDescription || "A meta description will appear here once you add one."}
              </p>
            </div>
          </div>
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
