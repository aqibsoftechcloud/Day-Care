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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { ApiError } from "@/lib/api/client";
import { createGeneralFaq, getGeneralFaq, updateGeneralFaq } from "@/lib/api/general-faqs";
import { notify } from "@/lib/toast";
import { generalFaqsKeys } from "@/components/admin/general-faqs/queries";
import type { GeneralFaq } from "@/types/general-faq";

// Mirrors validators/general-faq.validator.ts's createGeneralFaqSchema exactly.
const generalFaqFormSchema = z.object({
  question: z.string().trim().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  status: z.enum(["active", "inactive"]),
});

type GeneralFaqFormValues = z.infer<typeof generalFaqFormSchema>;

type GeneralFaqFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  faqId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function GeneralFaqFormDialog({ open, mode, faqId, onOpenChange }: GeneralFaqFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add FAQ" : "Edit FAQ"}
      description={mode === "create" ? "Create a new FAQ." : "Update this FAQ's details."}
    >
      {/* Keyed by FAQ so re-opening for a different FAQ remounts with
          fresh defaultValues instead of needing a reset-in-effect. */}
      {open && (
        <GeneralFaqFormBody
          key={mode === "edit" ? (faqId ?? "edit") : "create"}
          mode={mode}
          faqId={faqId}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function GeneralFaqFormBody({
  mode,
  faqId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  faqId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const faqQuery = useQuery({
    queryKey: generalFaqsKeys.detail(faqId ?? -1),
    queryFn: () => getGeneralFaq(faqId as number),
    enabled: mode === "edit" && faqId !== null,
  });

  if (mode === "edit" && faqQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading FAQ…
      </div>
    );
  }

  if (mode === "edit" && faqQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {faqQuery.error instanceof ApiError ? faqQuery.error.message : "Failed to load FAQ."}
      </p>
    );
  }

  return (
    <GeneralFaqForm mode={mode} faqId={faqId} initialFaq={faqQuery.data?.generalFaq} onOpenChange={onOpenChange} />
  );
}

function GeneralFaqForm({
  mode,
  faqId,
  initialFaq,
  onOpenChange,
}: {
  mode: "create" | "edit";
  faqId: number | null;
  initialFaq?: GeneralFaq;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<GeneralFaqFormValues>({
    resolver: zodResolver(generalFaqFormSchema),
    defaultValues: {
      question: initialFaq?.question ?? "",
      answer: initialFaq?.answer ?? "",
      status: initialFaq?.status === "inactive" ? "inactive" : "active",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: GeneralFaqFormValues) => {
      if (mode === "create") {
        return createGeneralFaq(values);
      }
      return updateGeneralFaq(faqId as number, values);
    },
    onSuccess: () => {
      notify.success(mode === "create" ? "FAQ created successfully." : "FAQ updated successfully.");
      queryClient.invalidateQueries({ queryKey: generalFaqsKeys.all });
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: GeneralFaqFormValues) => {
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
        <Field data-invalid={!!errors.question || undefined}>
          <FieldLabel htmlFor="faq-question">
            Question <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="faq-question"
            placeholder="e.g. What are your visiting hours?"
            aria-invalid={!!errors.question || undefined}
            {...register("question")}
          />
          <FieldError errors={[errors.question]} />
        </Field>

        <Field data-invalid={!!errors.answer || undefined}>
          <FieldLabel htmlFor="faq-answer">
            Answer <span className="text-destructive">*</span>
          </FieldLabel>
          <Textarea
            id="faq-answer"
            rows={6}
            placeholder="Write the full answer here"
            aria-invalid={!!errors.answer || undefined}
            {...register("answer")}
          />
          <FieldError errors={[errors.answer]} />
        </Field>

        <Field data-invalid={!!errors.status || undefined}>
          <FieldLabel htmlFor="faq-status">Status</FieldLabel>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="faq-status" className="w-full">
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
          {mode === "create" ? "Create FAQ" : "Save Changes"}
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
