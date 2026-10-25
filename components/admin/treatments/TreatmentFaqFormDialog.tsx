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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { ApiError } from "@/lib/api/client";
import { createTreatmentFaq, getTreatmentFaq, updateTreatmentFaq } from "@/lib/api/treatment-faqs";
import { notify } from "@/lib/toast";
import { treatmentFaqsKeys } from "@/components/admin/treatments/queries";
import type { TreatmentFaq } from "@/types/treatment-faq";

// Mirrors validators/treatment-faq.validator.ts's createTreatmentFaqSchema exactly.
const treatmentFaqFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255, "Title is too long"),
  text: z.string().trim().min(1, "Text is required"),
  status: z.enum(["active", "inactive"]),
});

type TreatmentFaqFormValues = z.infer<typeof treatmentFaqFormSchema>;

type TreatmentFaqFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  faqId: number | null;
  treatmentId: number;
  onOpenChange: (open: boolean) => void;
};

export function TreatmentFaqFormDialog({ open, mode, faqId, treatmentId, onOpenChange }: TreatmentFaqFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add FAQ" : "Edit FAQ"}
      description={mode === "create" ? "Create a new FAQ for this treatment." : "Update this FAQ."}
    >
      {open && (
        <TreatmentFaqFormBody
          key={mode === "edit" ? (faqId ?? "edit") : "create"}
          mode={mode}
          faqId={faqId}
          treatmentId={treatmentId}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function TreatmentFaqFormBody({
  mode,
  faqId,
  treatmentId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  faqId: number | null;
  treatmentId: number;
  onOpenChange: (open: boolean) => void;
}) {
  const faqQuery = useQuery({
    queryKey: treatmentFaqsKeys.detail(faqId ?? -1),
    queryFn: () => getTreatmentFaq(faqId as number),
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
    <TreatmentFaqForm
      mode={mode}
      faqId={faqId}
      treatmentId={treatmentId}
      initialFaq={faqQuery.data?.treatmentFaq}
      onOpenChange={onOpenChange}
    />
  );
}

function TreatmentFaqForm({
  mode,
  faqId,
  treatmentId,
  initialFaq,
  onOpenChange,
}: {
  mode: "create" | "edit";
  faqId: number | null;
  treatmentId: number;
  initialFaq?: TreatmentFaq;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TreatmentFaqFormValues>({
    resolver: zodResolver(treatmentFaqFormSchema),
    defaultValues: {
      title: initialFaq?.title ?? "",
      text: initialFaq?.text ?? "",
      status: initialFaq?.status === "inactive" ? "inactive" : "active",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: TreatmentFaqFormValues) => {
      const payload = { treatment_id: treatmentId, title: values.title, text: values.text, status: values.status };
      if (mode === "create") {
        return createTreatmentFaq(payload);
      }
      return updateTreatmentFaq(faqId as number, payload);
    },
    onSuccess: () => {
      notify.success(mode === "create" ? "FAQ created successfully." : "FAQ updated successfully.");
      queryClient.invalidateQueries({ queryKey: treatmentFaqsKeys.byTreatment(treatmentId) });
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: TreatmentFaqFormValues) => {
    mutation.mutate(values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {mutation.isError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {mutation.error instanceof ApiError ? mutation.error.message : "Something went wrong."}
        </div>
      )}

      <Field data-invalid={!!errors.title || undefined}>
        <FieldLabel htmlFor="treatment-faq-title">
          Title <span className="text-destructive">*</span>
        </FieldLabel>
        <Input id="treatment-faq-title" aria-invalid={!!errors.title || undefined} {...register("title")} />
        <FieldError errors={[errors.title]} />
      </Field>

      <Field data-invalid={!!errors.text || undefined}>
        <FieldLabel htmlFor="treatment-faq-text">
          Text <span className="text-destructive">*</span>
        </FieldLabel>
        <Textarea id="treatment-faq-text" rows={5} aria-invalid={!!errors.text || undefined} {...register("text")} />
        <FieldError errors={[errors.text]} />
      </Field>

      <Field data-invalid={!!errors.status || undefined}>
        <FieldLabel htmlFor="treatment-faq-status">Status</FieldLabel>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="treatment-faq-status" className="w-full">
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
