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
import { createSymptom, getSymptom, updateSymptom } from "@/lib/api/symptoms";
import { listSymptomParts } from "@/lib/api/symptom-parts";
import { notify } from "@/lib/toast";
import { symptomsKeys } from "@/components/admin/symptoms/queries";
import { symptomPartsKeys } from "@/components/admin/symptom-parts/queries";
import type { Symptom } from "@/types/symptom";

// Mirrors validators/symptom.validator.ts's createSymptomSchema exactly.
const symptomFormSchema = z.object({
  part_id: z.string().min(1, "Part is required"),
  symptom_name: z.string().trim().min(1, "Symptom name is required").max(255, "Name is too long"),
  status: z.enum(["active", "inactive"]),
});

type SymptomFormValues = z.infer<typeof symptomFormSchema>;

type SymptomFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  symptomId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function SymptomFormDialog({ open, mode, symptomId, onOpenChange }: SymptomFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add Symptom" : "Edit Symptom"}
      description={mode === "create" ? "Create a new symptom." : "Update this symptom's details."}
    >
      {open && (
        <SymptomFormBody
          key={mode === "edit" ? (symptomId ?? "edit") : "create"}
          mode={mode}
          symptomId={symptomId}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function SymptomFormBody({
  mode,
  symptomId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  symptomId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const symptomQuery = useQuery({
    queryKey: symptomsKeys.detail(symptomId ?? -1),
    queryFn: () => getSymptom(symptomId as number),
    enabled: mode === "edit" && symptomId !== null,
  });

  if (mode === "edit" && symptomQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading symptom…
      </div>
    );
  }

  if (mode === "edit" && symptomQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {symptomQuery.error instanceof ApiError ? symptomQuery.error.message : "Failed to load symptom."}
      </p>
    );
  }

  return (
    <SymptomForm mode={mode} symptomId={symptomId} initialSymptom={symptomQuery.data?.symptom} onOpenChange={onOpenChange} />
  );
}

function SymptomForm({
  mode,
  symptomId,
  initialSymptom,
  onOpenChange,
}: {
  mode: "create" | "edit";
  symptomId: number | null;
  initialSymptom?: Symptom;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const partsQuery = useQuery({ queryKey: symptomPartsKeys.all, queryFn: () => listSymptomParts() });
  const parts = partsQuery.data?.symptomParts ?? [];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SymptomFormValues>({
    resolver: zodResolver(symptomFormSchema),
    defaultValues: {
      part_id: initialSymptom ? String(initialSymptom.part_id) : "",
      symptom_name: initialSymptom?.symptom_name ?? "",
      status: initialSymptom?.status === "inactive" ? "inactive" : "active",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: SymptomFormValues) => {
      const payload = {
        part_id: Number(values.part_id),
        symptom_name: values.symptom_name,
        status: values.status,
      };
      if (mode === "create") {
        return createSymptom(payload);
      }
      return updateSymptom(symptomId as number, payload);
    },
    onSuccess: () => {
      notify.success(mode === "create" ? "Symptom created successfully." : "Symptom updated successfully.");
      queryClient.invalidateQueries({ queryKey: symptomsKeys.all });
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: SymptomFormValues) => {
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
        <Field data-invalid={!!errors.symptom_name || undefined}>
          <FieldLabel htmlFor="symptom-name">
            Symptom Name <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="symptom-name"
            aria-invalid={!!errors.symptom_name || undefined}
            {...register("symptom_name")}
          />
          <FieldError errors={[errors.symptom_name]} />
        </Field>

        <Field data-invalid={!!errors.part_id || undefined}>
          <FieldLabel htmlFor="symptom-part">
            Part <span className="text-destructive">*</span>
          </FieldLabel>
          <Controller
            name="part_id"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={partsQuery.isLoading}>
                <SelectTrigger id="symptom-part" className="w-full">
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

        <Field data-invalid={!!errors.status || undefined}>
          <FieldLabel htmlFor="symptom-status">Status</FieldLabel>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="symptom-status" className="w-full">
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
          {mode === "create" ? "Create Symptom" : "Save Changes"}
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
