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
import { BlogFaqsEditor, type BlogFaqDraft } from "@/components/admin/blogs/BlogFaqsEditor";
import { SearchableMultiSelect } from "@/components/admin/SearchableMultiSelect";
import { ApiError } from "@/lib/api/client";
import { createBlog, getBlog, setBlogRelatedContent, updateBlog } from "@/lib/api/blogs";
import { createBlogFaq, deleteBlogFaq, listBlogFaqs, updateBlogFaq } from "@/lib/api/blog-faqs";
import { listBlogCategories } from "@/lib/api/blog-categories";
import { listLanguages } from "@/lib/api/languages";
import { listCities } from "@/lib/api/cities";
import { listGlobalSpecialities } from "@/lib/api/global-specialities";
import { listGlobalTreatments } from "@/lib/api/global-treatments";
import { notify } from "@/lib/toast";
import { blogsKeys } from "@/components/admin/blogs/queries";
import { blogFaqsKeys } from "@/components/admin/blog-faqs/queries";
import { blogCategoriesKeys } from "@/components/admin/blog-categories/queries";
import { citiesKeys } from "@/components/admin/cities/queries";
import { languagesKeys } from "@/components/admin/languages/queries";
import { globalSpecialitiesKeys } from "@/components/admin/global-specialities/queries";
import { globalTreatmentsKeys } from "@/components/admin/global-treatments/queries";
import type { Blog } from "@/types/blog";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const IMAGE_HINT = "JPG, PNG, WEBP or GIF, up to 5MB";

/** Mirrors validators/blog.validator.ts's createBlogSchema exactly — blog_image is handled separately as File state (multipart, not part of this JSON-shaped schema). */
const blogFormSchema = z
  .object({
  blog_category_id: z.string().min(1, "Category is required"),
  blog_title: z.string().trim().min(1, "Blog title is required").max(255, "Title is too long"),
  language_id: z.string().min(1, "Language is required"),
  scope: z.enum(["global", "city"], { message: "Content scope is required" }),
  city_id: z.string(),
  published_date: z.string().optional(),
  search_keywords_for_doctors: z.string().trim().max(500, "Keywords are too long").optional(),
  blog_status: z.enum(["active", "inactive"]),
  ai_content_generator: z.boolean(),
  blog_text: z.string().optional(),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255, "SEO URL is too long"),
  meta_title: z.string().trim().max(255, "Meta title is too long").optional(),
  meta_keywords: z.string().trim().max(500, "Meta keywords is too long").optional(),
  meta_description: z.string().trim().optional(),
  author_name: z.string().trim().max(255, "Author name is too long").optional(),
  is_featured: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.scope === "city" && !values.city_id) {
      ctx.addIssue({ code: "custom", path: ["city_id"], message: "City is required for a city-specific blog" });
    }
  });

type BlogFormValues = z.infer<typeof blogFormSchema>;

type BlogFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  blogId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function BlogFormDialog({ open, mode, blogId, onOpenChange }: BlogFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add Blog" : "Edit Blog"}
      description={mode === "create" ? "Create a new blog." : "Update this blog's details."}
      className="sm:max-w-4xl"
    >
      {open && (
        <BlogFormBody
          key={mode === "edit" ? (blogId ?? "edit") : "create"}
          mode={mode}
          blogId={blogId}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function BlogFormBody({
  mode,
  blogId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  blogId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const blogQuery = useQuery({
    queryKey: blogsKeys.detail(blogId ?? -1),
    queryFn: () => getBlog(blogId as number),
    enabled: mode === "edit" && blogId !== null,
  });

  if (mode === "edit" && blogQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading blog…
      </div>
    );
  }

  if (mode === "edit" && blogQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {blogQuery.error instanceof ApiError ? blogQuery.error.message : "Failed to load blog."}
      </p>
    );
  }

  return (
    <BlogForm mode={mode} blogId={blogId} initialBlog={blogQuery.data?.blog} onOpenChange={onOpenChange} />
  );
}

/** Converts a stored ISO datetime into the `yyyy-MM-dd` shape `<input type="date">` needs. */
function toDateInputValue(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function BlogForm({
  mode,
  blogId,
  initialBlog,
  onOpenChange,
}: {
  mode: "create" | "edit";
  blogId: number | null;
  initialBlog?: Blog;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const blogCategoriesQuery = useQuery({ queryKey: blogCategoriesKeys.all, queryFn: () => listBlogCategories() });
  const languagesQuery = useQuery({ queryKey: languagesKeys.all, queryFn: listLanguages });
  const citiesQuery = useQuery({ queryKey: citiesKeys.all, queryFn: listCities });
  const blogFaqsQuery = useQuery({
    queryKey: blogFaqsKeys.byBlog(blogId ?? -1),
    queryFn: () => listBlogFaqs({ blog_id: blogId as number }),
    enabled: mode === "edit" && blogId !== null,
  });
  const globalSpecialitiesQuery = useQuery({
    queryKey: [...globalSpecialitiesKeys.all, "active"],
    queryFn: () => listGlobalSpecialities({ status: "active" }),
  });
  const globalTreatmentsQuery = useQuery({
    queryKey: [...globalTreatmentsKeys.all, "active"],
    queryFn: () => listGlobalTreatments({ status: "active" }),
  });

  const blogCategories = blogCategoriesQuery.data?.blogCategories ?? [];
  const languages = languagesQuery.data?.languages ?? [];
  const cities = citiesQuery.data?.cities ?? [];
  const globalSpecialityOptions = (globalSpecialitiesQuery.data?.globalSpecialities ?? []).map((s) => ({
    value: s.id,
    label: s.speciality_title?.trim() || s.speciality_name,
  }));
  const globalTreatmentOptions = (globalTreatmentsQuery.data?.globalTreatments ?? []).map((t) => ({
    value: t.id,
    label: t.treatment_title?.trim() || t.treatment_name,
  }));

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [authorImageFiles, setAuthorImageFiles] = useState<File[]>([]);
  const [authorImageCleared, setAuthorImageCleared] = useState(false);
  const [faqs, setFaqs] = useState<BlogFaqDraft[]>([]);
  const [originalFaqIds, setOriginalFaqIds] = useState<number[]>([]);
  const [faqsInitialized, setFaqsInitialized] = useState(false);
  // Optional, many-to-many Related Reading associations — see
  // blog_global_speciality_mappings' own doc comment. Not part of
  // blogFormSchema (no scalar field maps to a multi-value selection);
  // seeded directly from the already-fetched `initialBlog` (no second
  // round-trip needed, unlike FAQs which have their own query) and
  // persisted via its own endpoint, bundled into the same mutationFn
  // below so a single Save still does everything in one action.
  const [relatedSpecialityIds, setRelatedSpecialityIds] = useState<number[]>(
    initialBlog?.related_global_speciality_ids ?? []
  );
  const [relatedTreatmentIds, setRelatedTreatmentIds] = useState<number[]>(
    initialBlog?.related_global_treatment_ids ?? []
  );

  // Preloads this blog's existing FAQs exactly once — same "initialized"
  // guard used elsewhere in this codebase for edit-mode preselection
  // (e.g. DoctorFormDialog's speciality/hospital pickers). `originalFaqIds`
  // is kept separately so the save step can tell which real FAQs were
  // removed from the local list (and should be deactivated) vs. ones that
  // were never persisted at all.
  if (mode === "edit" && !faqsInitialized && blogFaqsQuery.data) {
    const loaded: BlogFaqDraft[] = blogFaqsQuery.data.blogFaqs.map((faq) => ({
      key: String(faq.id),
      id: faq.id,
      title: faq.title,
      text: faq.text,
      status: faq.status,
      sorting_order: faq.sorting_order,
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
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BlogFormValues>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: {
      blog_category_id: initialBlog ? String(initialBlog.blog_category_id) : "",
      blog_title: initialBlog?.blog_title ?? "",
      language_id: initialBlog ? String(initialBlog.language_id) : "",
      // New blogs start with NO scope chosen, so global vs city is always a deliberate decision.
      scope: (initialBlog?.scope ?? "") as "global" | "city",
      city_id: initialBlog?.city_id ? String(initialBlog.city_id) : "",
      published_date: toDateInputValue(initialBlog?.published_date),
      search_keywords_for_doctors: initialBlog?.search_keywords_for_doctors ?? "",
      blog_status: initialBlog?.blog_status === "inactive" ? "inactive" : "active",
      ai_content_generator: initialBlog?.ai_content_generator ?? false,
      blog_text: initialBlog?.blog_text ?? "",
      seo_url: initialBlog?.seo_url ?? "",
      meta_title: initialBlog?.meta_title ?? "",
      meta_keywords: initialBlog?.meta_keywords ?? "",
      meta_description: initialBlog?.meta_description ?? "",
      author_name: initialBlog?.author_name ?? "",
      is_featured: initialBlog?.is_featured ?? false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: BlogFormValues) => {
      const payload = {
        blog_category_id: Number(values.blog_category_id),
        blog_title: values.blog_title,
        language_id: Number(values.language_id),
        scope: values.scope,
        // A global blog never carries a city.
        ...(values.scope === "city" ? { city_id: Number(values.city_id) } : {}),
        published_date: values.published_date ? values.published_date : null,
        search_keywords_for_doctors: values.search_keywords_for_doctors ? values.search_keywords_for_doctors : null,
        blog_status: values.blog_status,
        ai_content_generator: values.ai_content_generator,
        blog_text: values.blog_text ? values.blog_text : null,
        seo_url: values.seo_url,
        meta_title: values.meta_title ? values.meta_title : null,
        meta_keywords: values.meta_keywords ? values.meta_keywords : null,
        meta_description: values.meta_description ? values.meta_description : null,
        author_name: values.author_name ? values.author_name : null,
        is_featured: values.is_featured,
      };
      const authorImage = authorImageFiles[0] ?? (authorImageCleared ? null : undefined);
      const result =
        mode === "create"
          ? await createBlog(payload, imageFiles[0], authorImageFiles[0])
          : await updateBlog(blogId as number, payload, imageFiles[0], authorImage);

      // Syncs FAQs through the same existing CRUD endpoints the old
      // standalone Blog FAQs admin page used — for a new blog this is the
      // id the API just assigned, not blogId (null in create mode). Not
      // wrapped in try/catch: a failure here throws out of mutationFn, so
      // onError fires and onSuccess never does — no false "success" toast
      // if the blog saved but an FAQ failed to sync (e.g. a blank
      // question/answer left in an added FAQ card).
      const currentIds = faqs.filter((faq) => faq.id !== null).map((faq) => faq.id as number);
      const toDelete = originalFaqIds.filter((id) => !currentIds.includes(id));

      await Promise.all([
        ...faqs.map((faq) =>
          faq.id === null
            ? createBlogFaq({
                blog_id: result.blog.id,
                title: faq.title,
                text: faq.text,
                sorting_order: faq.sorting_order,
                status: faq.status,
              })
            : updateBlogFaq(faq.id, {
                title: faq.title,
                text: faq.text,
                sorting_order: faq.sorting_order,
                status: faq.status,
              })
        ),
        ...toDelete.map((id) => deleteBlogFaq(id)),
      ]);

      // Same convention as the FAQ sync above (and for the same reason —
      // see its own comment): not wrapped in try/catch, so a failure
      // here throws out of mutationFn and onSuccess never runs, rather
      // than a false "success" toast for a blog whose Related
      // Specialities/Treatments didn't actually save.
      await setBlogRelatedContent(result.blog.id, {
        global_speciality_ids: relatedSpecialityIds,
        global_treatment_ids: relatedTreatmentIds,
      });

      return result;
    },
    onSuccess: (result) => {
      notify.success(mode === "create" ? "Blog created successfully." : "Blog updated successfully.");
      queryClient.invalidateQueries({ queryKey: blogsKeys.all });
      queryClient.invalidateQueries({ queryKey: blogFaqsKeys.byBlog(result.blog.id) });
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: BlogFormValues) => {
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
          Blog Information
        </FieldLegend>
        <FormFieldGrid>
          <Field className="sm:col-span-2" data-invalid={!!errors.blog_title || undefined}>
            <FieldLabel htmlFor="blog-title">
              Blog Title <span className="text-destructive">*</span>
            </FieldLabel>
            <Input id="blog-title" aria-invalid={!!errors.blog_title || undefined} {...register("blog_title")} />
            <FieldError errors={[errors.blog_title]} />
          </Field>

          <Field data-invalid={!!errors.blog_category_id || undefined}>
            <FieldLabel htmlFor="blog-category">
              Category <span className="text-destructive">*</span>
            </FieldLabel>
            <Controller
              name="blog_category_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={blogCategoriesQuery.isLoading}>
                  <SelectTrigger id="blog-category" className="w-full">
                    <SelectValue placeholder={blogCategoriesQuery.isLoading ? "Loading…" : "Select a category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {blogCategories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.category_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.blog_category_id]} />
          </Field>

          <Field data-invalid={!!errors.language_id || undefined}>
            <FieldLabel htmlFor="blog-language">
              Language <span className="text-destructive">*</span>
            </FieldLabel>
            <Controller
              name="language_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={languagesQuery.isLoading}>
                  <SelectTrigger id="blog-language" className="w-full">
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
            <FieldLabel htmlFor="blog-scope">
              Content Scope <span className="text-destructive">*</span>
            </FieldLabel>
            <Controller
              name="scope"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (value === "global") setValue("city_id", "");
                  }}
                >
                  <SelectTrigger id="blog-scope" className="w-full">
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global Blog</SelectItem>
                    <SelectItem value="city">City-Specific Blog</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.scope]} />
          </Field>

          {watch("scope") === "city" && (
          <Field data-invalid={!!errors.city_id || undefined}>
            <FieldLabel htmlFor="blog-city">
              City <span className="text-destructive">*</span>
            </FieldLabel>
            <Controller
              name="city_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={citiesQuery.isLoading}>
                  <SelectTrigger id="blog-city" className="w-full">
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
          )}

          <Field data-invalid={!!errors.published_date || undefined}>
            <FieldLabel htmlFor="blog-published-date">
              Published Date <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="blog-published-date" type="date" {...register("published_date")} />
            <FieldError errors={[errors.published_date]} />
          </Field>

          <Field data-invalid={!!errors.blog_status || undefined}>
            <FieldLabel htmlFor="blog-status">Status</FieldLabel>
            <Controller
              name="blog_status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="blog-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.blog_status]} />
          </Field>

          <Field className="sm:col-span-2" data-invalid={!!errors.search_keywords_for_doctors || undefined}>
            <FieldLabel htmlFor="blog-search-keywords">
              Search Keywords for Doctors <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="blog-search-keywords" {...register("search_keywords_for_doctors")} />
            <FieldError errors={[errors.search_keywords_for_doctors]} />
          </Field>

          <Field className="sm:col-span-2">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3">
              <div>
                <FieldLabel htmlFor="blog-ai-content-generator">AI Content Generator</FieldLabel>
                <p className="text-helper">Marks this blog as eligible for AI-assisted content generation.</p>
              </div>
              <Controller
                name="ai_content_generator"
                control={control}
                render={({ field }) => (
                  <Switch id="blog-ai-content-generator" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
          </Field>

          <Field className="sm:col-span-2">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3">
              <div>
                <FieldLabel htmlFor="blog-is-featured">Featured Blog</FieldLabel>
                <p className="text-helper">Marks this blog as featured on the public site.</p>
              </div>
              <Controller
                name="is_featured"
                control={control}
                render={({ field }) => (
                  <Switch id="blog-is-featured" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
          </Field>

          <Field className="sm:col-span-2">
            <FieldLabel>
              Blog Image <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            {mode === "edit" && initialBlog?.blog_image && imageFiles.length === 0 && (
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- small preview of the currently stored image. */}
                <img
                  src={initialBlog.blog_image}
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
          Author
        </FieldLegend>
        <FormFieldGrid>
          <Field className="sm:col-span-2" data-invalid={!!errors.author_name || undefined}>
            <FieldLabel htmlFor="blog-author-name">
              Author Name <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="blog-author-name" {...register("author_name")} />
            <FieldError errors={[errors.author_name]} />
          </Field>

          <Field className="sm:col-span-2">
            <FieldLabel>
              Author Image <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            {mode === "edit" && initialBlog?.author_image && authorImageFiles.length === 0 && !authorImageCleared && (
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- small preview of the currently stored image. */}
                <img
                  src={initialBlog.author_image}
                  alt=""
                  className="size-10 rounded-full border border-border object-cover"
                />
                <span className="text-body-sm text-muted-foreground">Current image — upload a new file to replace it.</span>
                <button
                  type="button"
                  onClick={() => setAuthorImageCleared(true)}
                  disabled={mutation.isPending}
                  className="ml-auto shrink-0 text-body-sm font-medium text-destructive hover:underline disabled:pointer-events-none disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            )}
            <FileUploadArea
              files={authorImageFiles}
              onFilesChange={(files) => {
                setAuthorImageFiles(files);
                if (files.length > 0) setAuthorImageCleared(false);
              }}
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
          <Field className="sm:col-span-2" data-invalid={!!errors.blog_text || undefined}>
            <FieldLabel htmlFor="blog-text">
              Blog Content <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Controller
              name="blog_text"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  id="blog-text"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Start writing the content for this blog..."
                  error={!!errors.blog_text}
                />
              )}
            />
            <FieldError errors={[errors.blog_text]} />
          </Field>
        </FormFieldGrid>
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
          Related Content
        </FieldLegend>
        <p className="text-helper">
          Controls where this blog appears as Related Reading on global/city speciality and treatment pages — both
          optional.
        </p>
        <FormFieldGrid>
          <Field className="sm:col-span-2">
            <FieldLabel>
              Related Specialities <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <SearchableMultiSelect
              options={globalSpecialityOptions}
              selected={relatedSpecialityIds}
              onChange={setRelatedSpecialityIds}
              placeholder="Search and select specialities..."
              searchPlaceholder="Search specialities..."
              emptyText="No active global specialities found."
              loading={globalSpecialitiesQuery.isLoading}
              disabled={mutation.isPending}
            />
          </Field>

          <Field className="sm:col-span-2">
            <FieldLabel>
              Related Treatments <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <SearchableMultiSelect
              options={globalTreatmentOptions}
              selected={relatedTreatmentIds}
              onChange={setRelatedTreatmentIds}
              placeholder="Search and select treatments..."
              searchPlaceholder="Search treatments..."
              emptyText="No active global treatments found."
              loading={globalTreatmentsQuery.isLoading}
              disabled={mutation.isPending}
            />
          </Field>
        </FormFieldGrid>
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
          SEO
        </FieldLegend>
        <FormFieldGrid>
          <Field className="sm:col-span-2" data-invalid={!!errors.seo_url || undefined}>
            <FieldLabel htmlFor="blog-seo-url">
              SEO URL <span className="text-destructive">*</span>
            </FieldLabel>
            <Input id="blog-seo-url" aria-invalid={!!errors.seo_url || undefined} {...register("seo_url")} />
            <FieldError errors={[errors.seo_url]} />
          </Field>

          <Field data-invalid={!!errors.meta_title || undefined}>
            <FieldLabel htmlFor="blog-meta-title">
              Meta Title <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="blog-meta-title" {...register("meta_title")} />
            <FieldError errors={[errors.meta_title]} />
          </Field>

          <Field data-invalid={!!errors.meta_keywords || undefined}>
            <FieldLabel htmlFor="blog-meta-keywords">
              Meta Keywords <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="blog-meta-keywords" {...register("meta_keywords")} />
            <FieldError errors={[errors.meta_keywords]} />
          </Field>

          <Field className="sm:col-span-2" data-invalid={!!errors.meta_description || undefined}>
            <FieldLabel htmlFor="blog-meta-description">
              Meta Description <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Textarea id="blog-meta-description" rows={3} {...register("meta_description")} />
            <FieldError errors={[errors.meta_description]} />
          </Field>
        </FormFieldGrid>
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
          FAQs
        </FieldLegend>
        {mode === "edit" && blogFaqsQuery.isLoading ? (
          <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Loading FAQs…
          </div>
        ) : (
          <BlogFaqsEditor faqs={faqs} onChange={setFaqs} disabled={mutation.isPending} />
        )}
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
          {mode === "create" ? "Create Blog" : "Save Changes"}
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
