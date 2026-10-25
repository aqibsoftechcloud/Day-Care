"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/admin/FormDialog";
import { LoadingButton } from "@/components/admin/LoadingButton";
import { FileUploadArea } from "@/components/admin/FileUploadArea";
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { ApiError } from "@/lib/api/client";
import { createSpecialitySymptom, getSpecialitySymptom, updateSpecialitySymptom } from "@/lib/api/speciality-symptoms";
import { notify } from "@/lib/toast";
import { specialitySymptomsKeys } from "@/components/admin/specialities/queries";
import type { SpecialitySymptom } from "@/types/speciality-symptom";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const IMAGE_HINT = "JPG, PNG, WEBP or GIF, up to 5MB";

// Mirrors validators/speciality-symptom.validator.ts's createSpecialitySymptomSchema —
// `image` is handled separately as File state below since it's a multipart file.
const specialitySymptomFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255, "Name is too long"),
  sorting_order: z.string().trim().refine((v) => v === "" || /^-?\d+$/.test(v), "Enter a whole number"),
  status: z.enum(["active", "inactive"]),
});

type SpecialitySymptomFormValues = z.infer<typeof specialitySymptomFormSchema>;

type SpecialitySymptomFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  symptomId: number | null;
  specialityId: number;
  onOpenChange: (open: boolean) => void;
};

export function SpecialitySymptomFormDialog({ open, mode, symptomId, specialityId, onOpenChange }: SpecialitySymptomFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add Symptom" : "Edit Symptom"}
      description={mode === "create" ? "Create a new symptom for this speciality." : "Update this symptom."}
    >
      {open && (
        <SpecialitySymptomFormBody
          key={mode === "edit" ? (symptomId ?? "edit") : "create"}
          mode={mode}
          symptomId={symptomId}
          specialityId={specialityId}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function SpecialitySymptomFormBody({
  mode,
  symptomId,
  specialityId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  symptomId: number | null;
  specialityId: number;
  onOpenChange: (open: boolean) => void;
}) {
  const symptomQuery = useQuery({
    queryKey: specialitySymptomsKeys.detail(symptomId ?? -1),
    queryFn: () => getSpecialitySymptom(symptomId as number),
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
    <SpecialitySymptomForm
      mode={mode}
      symptomId={symptomId}
      specialityId={specialityId}
      initialSymptom={symptomQuery.data?.specialitySymptom}
      onOpenChange={onOpenChange}
    />
  );
}

function SpecialitySymptomForm({
  mode,
  symptomId,
  specialityId,
  initialSymptom,
  onOpenChange,
}: {
  mode: "create" | "edit";
  symptomId: number | null;
  specialityId: number;
  initialSymptom?: SpecialitySymptom;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SpecialitySymptomFormValues>({
    resolver: zodResolver(specialitySymptomFormSchema),
    defaultValues: {
      name: initialSymptom?.name ?? "",
      sorting_order: initialSymptom ? String(initialSymptom.sorting_order) : "0",
      status: initialSymptom?.status === "inactive" ? "inactive" : "active",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: SpecialitySymptomFormValues) => {
      const payload = {
        speciality_id: specialityId,
        name: values.name,
        sorting_order: values.sorting_order === "" ? 0 : Number(values.sorting_order),
        status: values.status,
      };
      if (mode === "create") {
        return createSpecialitySymptom(payload, imageFiles[0]);
      }
      return updateSpecialitySymptom(symptomId as number, payload, imageFiles[0]);
    },
    onSuccess: () => {
      notify.success(mode === "create" ? "Symptom created successfully." : "Symptom updated successfully.");
      queryClient.invalidateQueries({ queryKey: specialitySymptomsKeys.bySpeciality(specialityId) });
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: SpecialitySymptomFormValues) => {
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

      <Field data-invalid={!!errors.name || undefined}>
        <FieldLabel htmlFor="speciality-symptom-name">
          Name <span className="text-destructive">*</span>
        </FieldLabel>
        <Input id="speciality-symptom-name" aria-invalid={!!errors.name || undefined} {...register("name")} />
        <FieldError errors={[errors.name]} />
      </Field>

      <Field data-invalid={!!errors.sorting_order || undefined}>
        <FieldLabel htmlFor="speciality-symptom-sorting-order">Sorting Order</FieldLabel>
        <Input
          id="speciality-symptom-sorting-order"
          type="number"
          step="1"
          aria-invalid={!!errors.sorting_order || undefined}
          {...register("sorting_order")}
        />
        <FieldError errors={[errors.sorting_order]} />
      </Field>

      <Field data-invalid={!!errors.status || undefined}>
        <FieldLabel htmlFor="speciality-symptom-status">Status</FieldLabel>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="speciality-symptom-status" className="w-full">
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

      <Field>
        <FieldLabel>
          Image <span className="text-muted-foreground">(optional)</span>
        </FieldLabel>
        {mode === "edit" && initialSymptom?.image && imageFiles.length === 0 && (
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- small preview of the currently stored image. */}
            <img src={initialSymptom.image} alt="" className="size-10 rounded-md border border-border object-cover" />
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
