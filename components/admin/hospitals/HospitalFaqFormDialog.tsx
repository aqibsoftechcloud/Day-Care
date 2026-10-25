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
import { createHospitalFaq, getHospitalFaq, updateHospitalFaq } from "@/lib/api/hospital-faqs";
import { notify } from "@/lib/toast";
import { hospitalFaqsKeys } from "@/components/admin/hospitals/queries";
import type { HospitalFaq } from "@/types/hospital-faq";

// Mirrors validators/hospital-faq.validator.ts's createHospitalFaqSchema exactly.
const hospitalFaqFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255, "Title is too long"),
  text: z.string().trim().min(1, "Text is required"),
  status: z.enum(["active", "inactive"]),
});

type HospitalFaqFormValues = z.infer<typeof hospitalFaqFormSchema>;

type HospitalFaqFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  faqId: number | null;
  hospitalId: number;
  onOpenChange: (open: boolean) => void;
};

export function HospitalFaqFormDialog({ open, mode, faqId, hospitalId, onOpenChange }: HospitalFaqFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add FAQ" : "Edit FAQ"}
      description={mode === "create" ? "Create a new FAQ for this hospital." : "Update this FAQ."}
    >
      {open && (
        <HospitalFaqFormBody
          key={mode === "edit" ? (faqId ?? "edit") : "create"}
          mode={mode}
          faqId={faqId}
          hospitalId={hospitalId}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function HospitalFaqFormBody({
  mode,
  faqId,
  hospitalId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  faqId: number | null;
  hospitalId: number;
  onOpenChange: (open: boolean) => void;
}) {
  const faqQuery = useQuery({
    queryKey: hospitalFaqsKeys.detail(faqId ?? -1),
    queryFn: () => getHospitalFaq(faqId as number),
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
    <HospitalFaqForm
      mode={mode}
      faqId={faqId}
      hospitalId={hospitalId}
      initialFaq={faqQuery.data?.hospitalFaq}
      onOpenChange={onOpenChange}
    />
  );
}

function HospitalFaqForm({
  mode,
  faqId,
  hospitalId,
  initialFaq,
  onOpenChange,
}: {
  mode: "create" | "edit";
  faqId: number | null;
  hospitalId: number;
  initialFaq?: HospitalFaq;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<HospitalFaqFormValues>({
    resolver: zodResolver(hospitalFaqFormSchema),
    defaultValues: {
      title: initialFaq?.title ?? "",
      text: initialFaq?.text ?? "",
      status: initialFaq?.status === "inactive" ? "inactive" : "active",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: HospitalFaqFormValues) => {
      const payload = { hospital_id: hospitalId, title: values.title, text: values.text, status: values.status };
      if (mode === "create") {
        return createHospitalFaq(payload);
      }
      return updateHospitalFaq(faqId as number, payload);
    },
    onSuccess: () => {
      notify.success(mode === "create" ? "FAQ created successfully." : "FAQ updated successfully.");
      queryClient.invalidateQueries({ queryKey: hospitalFaqsKeys.byHospital(hospitalId) });
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: HospitalFaqFormValues) => {
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
        <FieldLabel htmlFor="hospital-faq-title">
          Title <span className="text-destructive">*</span>
        </FieldLabel>
        <Input id="hospital-faq-title" aria-invalid={!!errors.title || undefined} {...register("title")} />
        <FieldError errors={[errors.title]} />
      </Field>

      <Field data-invalid={!!errors.text || undefined}>
        <FieldLabel htmlFor="hospital-faq-text">
          Text <span className="text-destructive">*</span>
        </FieldLabel>
        <Textarea id="hospital-faq-text" rows={5} aria-invalid={!!errors.text || undefined} {...register("text")} />
        <FieldError errors={[errors.text]} />
      </Field>

      <Field data-invalid={!!errors.status || undefined}>
        <FieldLabel htmlFor="hospital-faq-status">Status</FieldLabel>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="hospital-faq-status" className="w-full">
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
