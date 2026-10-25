"use client";

import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/admin/FormDialog";
import { LoadingButton } from "@/components/admin/LoadingButton";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { ApiError } from "@/lib/api/client";
import { createLanguage, getLanguage, updateLanguage } from "@/lib/api/languages";
import { notify } from "@/lib/toast";
import { languagesKeys } from "@/components/admin/languages/queries";
import type { Language } from "@/types/language";

// Mirrors validators/language.validator.ts's createLanguageSchema exactly.
const languageFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255, "SEO URL is too long"),
  status: z.enum(["active", "inactive"]),
});

type LanguageFormValues = z.infer<typeof languageFormSchema>;

type LanguageFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  languageId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function LanguageFormDialog({ open, mode, languageId, onOpenChange }: LanguageFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add Language" : "Edit Language"}
      description={mode === "create" ? "Create a new language." : "Update this language's details."}
    >
      {/* Keyed by language so re-opening for a different language remounts
          with fresh defaultValues instead of needing a reset-in-effect. */}
      {open && (
        <LanguageFormBody
          key={mode === "edit" ? (languageId ?? "edit") : "create"}
          mode={mode}
          languageId={languageId}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function LanguageFormBody({
  mode,
  languageId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  languageId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const languageQuery = useQuery({
    queryKey: languagesKeys.detail(languageId ?? -1),
    queryFn: () => getLanguage(languageId as number),
    enabled: mode === "edit" && languageId !== null,
  });

  if (mode === "edit" && languageQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading language…
      </div>
    );
  }

  if (mode === "edit" && languageQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {languageQuery.error instanceof ApiError ? languageQuery.error.message : "Failed to load language."}
      </p>
    );
  }

  return (
    <LanguageForm
      mode={mode}
      languageId={languageId}
      initialLanguage={languageQuery.data?.language}
      onOpenChange={onOpenChange}
    />
  );
}

function LanguageForm({
  mode,
  languageId,
  initialLanguage,
  onOpenChange,
}: {
  mode: "create" | "edit";
  languageId: number | null;
  initialLanguage?: Language;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LanguageFormValues>({
    resolver: zodResolver(languageFormSchema),
    defaultValues: {
      name: initialLanguage?.name ?? "",
      seo_url: initialLanguage?.seo_url ?? "",
      status: initialLanguage?.status === "inactive" ? "inactive" : "active",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: LanguageFormValues) => {
      if (mode === "create") {
        return createLanguage(values);
      }
      return updateLanguage(languageId as number, values);
    },
    onSuccess: () => {
      notify.success(mode === "create" ? "Language created successfully." : "Language updated successfully.");
      queryClient.invalidateQueries({ queryKey: languagesKeys.all });
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: LanguageFormValues) => {
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

      <FieldGroup className="gap-4">
        <Field data-invalid={!!errors.name || undefined}>
          <FieldLabel htmlFor="language-name">
            Name <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="language-name"
            placeholder="e.g. English"
            aria-invalid={!!errors.name || undefined}
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field data-invalid={!!errors.seo_url || undefined}>
          <FieldLabel htmlFor="language-seo-url">
            SEO URL <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="language-seo-url"
            placeholder="e.g. english"
            aria-invalid={!!errors.seo_url || undefined}
            {...register("seo_url")}
          />
          <FieldError errors={[errors.seo_url]} />
        </Field>

        <Field data-invalid={!!errors.status || undefined}>
          <FieldLabel htmlFor="language-status">Status</FieldLabel>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="language-status" className="w-full">
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
      </FieldGroup>

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
          {mode === "create" ? "Create Language" : "Save Changes"}
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
