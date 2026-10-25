"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/admin/FormDialog";
import { FormFieldGrid } from "@/components/admin/FormFieldGrid";
import { LoadingButton } from "@/components/admin/LoadingButton";
import { SearchableMultiSelect } from "@/components/admin/SearchableMultiSelect";
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
import { createBlogCategory, getBlogCategory, updateBlogCategory } from "@/lib/api/blog-categories";
import { listGlobalSpecialities } from "@/lib/api/global-specialities";
import { listGlobalTreatments } from "@/lib/api/global-treatments";
import { notify } from "@/lib/toast";
import { blogCategoriesKeys } from "@/components/admin/blog-categories/queries";
import { globalSpecialitiesKeys } from "@/components/admin/global-specialities/queries";
import { globalTreatmentsKeys } from "@/components/admin/global-treatments/queries";
import type { BlogCategory } from "@/types/blog-category";

// Mirrors validators/blog-category.validator.ts's createBlogCategorySchema exactly.
const blogCategoryFormSchema = z.object({
  category_name: z.string().trim().min(1, "Category name is required").max(255, "Name is too long"),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255, "SEO URL is too long"),
  status: z.enum(["active", "inactive"]),
  meta_title: z.string().trim().max(255, "Meta title is too long").optional(),
  meta_keywords: z.string().trim().max(500, "Meta keywords is too long").optional(),
  meta_description: z.string().trim().optional(),
});

type BlogCategoryFormValues = z.infer<typeof blogCategoryFormSchema>;

type BlogCategoryFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  blogCategoryId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function BlogCategoryFormDialog({ open, mode, blogCategoryId, onOpenChange }: BlogCategoryFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add Blog Category" : "Edit Blog Category"}
      description={mode === "create" ? "Create a new blog category." : "Update this blog category's details."}
    >
      {open && (
        <BlogCategoryFormBody
          key={mode === "edit" ? (blogCategoryId ?? "edit") : "create"}
          mode={mode}
          blogCategoryId={blogCategoryId}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function BlogCategoryFormBody({
  mode,
  blogCategoryId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  blogCategoryId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const blogCategoryQuery = useQuery({
    queryKey: blogCategoriesKeys.detail(blogCategoryId ?? -1),
    queryFn: () => getBlogCategory(blogCategoryId as number),
    enabled: mode === "edit" && blogCategoryId !== null,
  });

  if (mode === "edit" && blogCategoryQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading blog category…
      </div>
    );
  }

  if (mode === "edit" && blogCategoryQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {blogCategoryQuery.error instanceof ApiError ? blogCategoryQuery.error.message : "Failed to load blog category."}
      </p>
    );
  }

  return (
    <BlogCategoryForm
      mode={mode}
      blogCategoryId={blogCategoryId}
      initialBlogCategory={blogCategoryQuery.data?.blogCategory}
      onOpenChange={onOpenChange}
    />
  );
}

function BlogCategoryForm({
  mode,
  blogCategoryId,
  initialBlogCategory,
  onOpenChange,
}: {
  mode: "create" | "edit";
  blogCategoryId: number | null;
  initialBlogCategory?: BlogCategory;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const globalSpecialitiesQuery = useQuery({
    queryKey: [...globalSpecialitiesKeys.all, "active"],
    queryFn: () => listGlobalSpecialities({ status: "active" }),
  });
  const globalTreatmentsQuery = useQuery({
    queryKey: [...globalTreatmentsKeys.all, "active"],
    queryFn: () => listGlobalTreatments({ status: "active" }),
  });
  const globalSpecialityOptions = (globalSpecialitiesQuery.data?.globalSpecialities ?? []).map((s) => ({
    value: s.id,
    label: s.speciality_title?.trim() || s.speciality_name,
  }));
  const globalTreatmentOptions = (globalTreatmentsQuery.data?.globalTreatments ?? []).map((t) => ({
    value: t.id,
    label: t.treatment_title?.trim() || t.treatment_name,
  }));

  // Default Related Reading associations for every blog in this category
  // — only a fallback when a blog has no explicit association of its own
  // (see services/blog.service.ts's getBlogs()). Not RHF-managed (no
  // scalar field maps to a multi-value selection); included directly in
  // the same JSON payload below, so create/update stays one atomic
  // request — no separate save step, unlike the blog-level feature.
  const [relatedSpecialityIds, setRelatedSpecialityIds] = useState<number[]>(
    initialBlogCategory?.related_global_speciality_ids ?? []
  );
  const [relatedTreatmentIds, setRelatedTreatmentIds] = useState<number[]>(
    initialBlogCategory?.related_global_treatment_ids ?? []
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BlogCategoryFormValues>({
    resolver: zodResolver(blogCategoryFormSchema),
    defaultValues: {
      category_name: initialBlogCategory?.category_name ?? "",
      seo_url: initialBlogCategory?.seo_url ?? "",
      status: initialBlogCategory?.status === "inactive" ? "inactive" : "active",
      meta_title: initialBlogCategory?.meta_title ?? "",
      meta_keywords: initialBlogCategory?.meta_keywords ?? "",
      meta_description: initialBlogCategory?.meta_description ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: BlogCategoryFormValues) => {
      const payload = {
        category_name: values.category_name,
        seo_url: values.seo_url,
        status: values.status,
        meta_title: values.meta_title ? values.meta_title : null,
        meta_keywords: values.meta_keywords ? values.meta_keywords : null,
        meta_description: values.meta_description ? values.meta_description : null,
        global_speciality_ids: relatedSpecialityIds,
        global_treatment_ids: relatedTreatmentIds,
      };
      if (mode === "create") {
        return createBlogCategory(payload);
      }
      return updateBlogCategory(blogCategoryId as number, payload);
    },
    onSuccess: () => {
      notify.success(mode === "create" ? "Blog category created successfully." : "Blog category updated successfully.");
      queryClient.invalidateQueries({ queryKey: blogCategoriesKeys.all });
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: BlogCategoryFormValues) => {
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
        <FormFieldGrid>
          <Field className="sm:col-span-2" data-invalid={!!errors.category_name || undefined}>
            <FieldLabel htmlFor="blog-category-name">
              Category Name <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="blog-category-name"
              aria-invalid={!!errors.category_name || undefined}
              {...register("category_name")}
            />
            <FieldError errors={[errors.category_name]} />
          </Field>

          <Field data-invalid={!!errors.status || undefined}>
            <FieldLabel htmlFor="blog-category-status">Status</FieldLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="blog-category-status" className="w-full">
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
          SEO
        </FieldLegend>
        <FormFieldGrid>
          <Field className="sm:col-span-2" data-invalid={!!errors.seo_url || undefined}>
            <FieldLabel htmlFor="blog-category-seo-url">
              SEO URL <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="blog-category-seo-url"
              aria-invalid={!!errors.seo_url || undefined}
              {...register("seo_url")}
            />
            <FieldError errors={[errors.seo_url]} />
          </Field>

          <Field data-invalid={!!errors.meta_title || undefined}>
            <FieldLabel htmlFor="blog-category-meta-title">
              Meta Title <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="blog-category-meta-title" {...register("meta_title")} />
            <FieldError errors={[errors.meta_title]} />
          </Field>

          <Field data-invalid={!!errors.meta_keywords || undefined}>
            <FieldLabel htmlFor="blog-category-meta-keywords">
              Meta Keywords <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="blog-category-meta-keywords" {...register("meta_keywords")} />
            <FieldError errors={[errors.meta_keywords]} />
          </Field>

          <Field className="sm:col-span-2" data-invalid={!!errors.meta_description || undefined}>
            <FieldLabel htmlFor="blog-category-meta-description">
              Meta Description <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Textarea id="blog-category-meta-description" rows={3} {...register("meta_description")} />
            <FieldError errors={[errors.meta_description]} />
          </Field>
        </FormFieldGrid>
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
          Related Content
        </FieldLegend>
        <p className="text-helper">
          Default Related Reading targets for every blog in this category — only used when a blog doesn&apos;t
          explicitly select its own (per target type).
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
          {mode === "create" ? "Create Blog Category" : "Save Changes"}
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
