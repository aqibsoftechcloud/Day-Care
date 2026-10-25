"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/admin/FormDialog";
import { FormFieldGrid } from "@/components/admin/FormFieldGrid";
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
import { ApiError } from "@/lib/api/client";
import { createSymptomArticle, getSymptomArticle, updateSymptomArticle } from "@/lib/api/symptom-articles";
import { listSymptomParts } from "@/lib/api/symptom-parts";
import { listSymptoms } from "@/lib/api/symptoms";
import { notify } from "@/lib/toast";
import { symptomArticlesKeys } from "@/components/admin/symptom-articles/queries";
import { symptomPartsKeys } from "@/components/admin/symptom-parts/queries";
import { symptomsKeys } from "@/components/admin/symptoms/queries";
import type { SymptomArticle } from "@/types/symptom-article";

// Mirrors validators/symptom-article.validator.ts's createSymptomArticleSchema exactly.
const symptomArticleFormSchema = z.object({
  article_name: z.string().trim().min(1, "Article name is required").max(255, "Name is too long"),
  part_id: z.string().min(1, "Part is required"),
  symptom_id: z.string().min(1, "Symptom is required"),
  status: z.enum(["active", "inactive"]),
  description: z.string().optional(),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255, "SEO URL is too long"),
  meta_title: z.string().trim().max(255, "Meta title is too long").optional(),
  meta_keywords: z.string().trim().max(500, "Meta keywords is too long").optional(),
  meta_description: z.string().trim().optional(),
});

type SymptomArticleFormValues = z.infer<typeof symptomArticleFormSchema>;

type SymptomArticleFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  articleId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function SymptomArticleFormDialog({ open, mode, articleId, onOpenChange }: SymptomArticleFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add Article" : "Edit Article"}
      description={mode === "create" ? "Create a new symptom article." : "Update this article's details."}
      className="sm:max-w-3xl"
    >
      {open && (
        <SymptomArticleFormBody
          key={mode === "edit" ? (articleId ?? "edit") : "create"}
          mode={mode}
          articleId={articleId}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function SymptomArticleFormBody({
  mode,
  articleId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  articleId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const articleQuery = useQuery({
    queryKey: symptomArticlesKeys.detail(articleId ?? -1),
    queryFn: () => getSymptomArticle(articleId as number),
    enabled: mode === "edit" && articleId !== null,
  });

  if (mode === "edit" && articleQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading article…
      </div>
    );
  }

  if (mode === "edit" && articleQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {articleQuery.error instanceof ApiError ? articleQuery.error.message : "Failed to load article."}
      </p>
    );
  }

  return (
    <SymptomArticleForm
      mode={mode}
      articleId={articleId}
      initialArticle={articleQuery.data?.symptomArticle}
      onOpenChange={onOpenChange}
    />
  );
}

function SymptomArticleForm({
  mode,
  articleId,
  initialArticle,
  onOpenChange,
}: {
  mode: "create" | "edit";
  articleId: number | null;
  initialArticle?: SymptomArticle;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const partsQuery = useQuery({ queryKey: symptomPartsKeys.all, queryFn: () => listSymptomParts() });
  const symptomsQuery = useQuery({ queryKey: symptomsKeys.all, queryFn: () => listSymptoms() });
  const parts = partsQuery.data?.symptomParts ?? [];
  const allSymptoms = useMemo(() => symptomsQuery.data?.symptoms ?? [], [symptomsQuery.data]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SymptomArticleFormValues>({
    resolver: zodResolver(symptomArticleFormSchema),
    defaultValues: {
      article_name: initialArticle?.article_name ?? "",
      part_id: initialArticle ? String(initialArticle.part_id) : "",
      symptom_id: initialArticle ? String(initialArticle.symptom_id) : "",
      status: initialArticle?.status === "inactive" ? "inactive" : "active",
      description: initialArticle?.description ?? "",
      seo_url: initialArticle?.seo_url ?? "",
      meta_title: initialArticle?.meta_title ?? "",
      meta_keywords: initialArticle?.meta_keywords ?? "",
      meta_description: initialArticle?.meta_description ?? "",
    },
  });

  const selectedPartId = watch("part_id");

  // Filters the Symptom picker to the selected Part as a frontend
  // convenience only — the backend validates part_id/symptom_id
  // independently and does not require them to match (confirmed by
  // reading validators/symptom-article.validator.ts's own comment), so
  // this narrows the UI without inventing a backend rule.
  const symptomOptions = useMemo(
    () => allSymptoms.filter((symptom) => String(symptom.part_id) === selectedPartId),
    [allSymptoms, selectedPartId]
  );

  const mutation = useMutation({
    mutationFn: async (values: SymptomArticleFormValues) => {
      const payload = {
        article_name: values.article_name,
        part_id: Number(values.part_id),
        symptom_id: Number(values.symptom_id),
        status: values.status,
        description: values.description ? values.description : null,
        seo_url: values.seo_url,
        meta_title: values.meta_title ? values.meta_title : null,
        meta_keywords: values.meta_keywords ? values.meta_keywords : null,
        meta_description: values.meta_description ? values.meta_description : null,
      };
      if (mode === "create") {
        return createSymptomArticle(payload);
      }
      return updateSymptomArticle(articleId as number, payload);
    },
    onSuccess: () => {
      notify.success(mode === "create" ? "Article created successfully." : "Article updated successfully.");
      queryClient.invalidateQueries({ queryKey: symptomArticlesKeys.all });
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: SymptomArticleFormValues) => {
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
          <Field className="sm:col-span-2" data-invalid={!!errors.article_name || undefined}>
            <FieldLabel htmlFor="symptom-article-name">
              Article Name <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="symptom-article-name"
              aria-invalid={!!errors.article_name || undefined}
              {...register("article_name")}
            />
            <FieldError errors={[errors.article_name]} />
          </Field>

          <Field data-invalid={!!errors.part_id || undefined}>
            <FieldLabel htmlFor="symptom-article-part">
              Part <span className="text-destructive">*</span>
            </FieldLabel>
            <Controller
              name="part_id"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setValue("symptom_id", "");
                  }}
                  disabled={partsQuery.isLoading}
                >
                  <SelectTrigger id="symptom-article-part" className="w-full">
                    <SelectValue placeholder={partsQuery.isLoading ? "Loading…" : "Select a part"} />
                  </SelectTrigger>
                  <SelectContent>
                    {parts.map((part) => (
                      <SelectItem key={part.id} value={String(part.id)}>
                        {part.part_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.part_id]} />
          </Field>

          <Field data-invalid={!!errors.symptom_id || undefined}>
            <FieldLabel htmlFor="symptom-article-symptom">
              Symptom <span className="text-destructive">*</span>
            </FieldLabel>
            <Controller
              name="symptom_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!selectedPartId}>
                  <SelectTrigger id="symptom-article-symptom" className="w-full">
                    <SelectValue placeholder={selectedPartId ? "Select a symptom" : "Select a part first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {symptomOptions.map((symptom) => (
                      <SelectItem key={symptom.id} value={String(symptom.id)}>
                        {symptom.symptom_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.symptom_id]} />
          </Field>

          <Field data-invalid={!!errors.status || undefined}>
            <FieldLabel htmlFor="symptom-article-status">Status</FieldLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="symptom-article-status" className="w-full">
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
          Content
        </FieldLegend>
        <FormFieldGrid>
          <Field className="sm:col-span-2" data-invalid={!!errors.description || undefined}>
            <FieldLabel htmlFor="symptom-article-description">
              Description <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  id="symptom-article-description"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Start writing the content for this article..."
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
            <FieldLabel htmlFor="symptom-article-seo-url">
              SEO URL <span className="text-destructive">*</span>
            </FieldLabel>
            <Input id="symptom-article-seo-url" aria-invalid={!!errors.seo_url || undefined} {...register("seo_url")} />
            <FieldError errors={[errors.seo_url]} />
          </Field>

          <Field data-invalid={!!errors.meta_title || undefined}>
            <FieldLabel htmlFor="symptom-article-meta-title">
              Meta Title <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="symptom-article-meta-title" {...register("meta_title")} />
            <FieldError errors={[errors.meta_title]} />
          </Field>

          <Field data-invalid={!!errors.meta_keywords || undefined}>
            <FieldLabel htmlFor="symptom-article-meta-keywords">
              Meta Keywords <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="symptom-article-meta-keywords" {...register("meta_keywords")} />
            <FieldError errors={[errors.meta_keywords]} />
          </Field>

          <Field className="sm:col-span-2" data-invalid={!!errors.meta_description || undefined}>
            <FieldLabel htmlFor="symptom-article-meta-description">
              Meta Description <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Textarea id="symptom-article-meta-description" rows={3} {...register("meta_description")} />
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
          {mode === "create" ? "Create Article" : "Save Changes"}
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
