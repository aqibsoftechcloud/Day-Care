"use client";

import { Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldError, FieldLabel, FieldSet } from "@/components/ui/field";
import { ApiError } from "@/lib/api/client";
import { createDoctorSpeciality, getDoctorSpeciality, updateDoctorSpeciality } from "@/lib/api/doctor-specialities";
import { listLanguages } from "@/lib/api/languages";
import { notify } from "@/lib/toast";
import { doctorSpecialitiesKeys } from "@/components/admin/doctor-specialities/queries";
import { languagesKeys } from "@/components/admin/languages/queries";
import type { DoctorSpeciality } from "@/types/doctor-speciality";

// Mirrors validators/doctor-speciality.validator.ts's createDoctorSpecialitySchema exactly.
const doctorSpecialityFormSchema = z.object({
  speciality_name: z.string().trim().min(1, "Speciality name is required").max(255, "Name is too long"),
  language_id: z.string().min(1, "Language is required"),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255, "SEO URL is too long"),
  status: z.enum(["active", "inactive"]),
});

type DoctorSpecialityFormValues = z.infer<typeof doctorSpecialityFormSchema>;

type DoctorSpecialityFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  doctorSpecialityId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function DoctorSpecialityFormDialog({ open, mode, doctorSpecialityId, onOpenChange }: DoctorSpecialityFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add Doctor Speciality" : "Edit Doctor Speciality"}
      description={mode === "create" ? "Create a new doctor speciality." : "Update this doctor speciality's details."}
    >
      {open && (
        <DoctorSpecialityFormBody
          key={mode === "edit" ? (doctorSpecialityId ?? "edit") : "create"}
          mode={mode}
          doctorSpecialityId={doctorSpecialityId}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function DoctorSpecialityFormBody({
  mode,
  doctorSpecialityId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  doctorSpecialityId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const doctorSpecialityQuery = useQuery({
    queryKey: doctorSpecialitiesKeys.detail(doctorSpecialityId ?? -1),
    queryFn: () => getDoctorSpeciality(doctorSpecialityId as number),
    enabled: mode === "edit" && doctorSpecialityId !== null,
  });

  if (mode === "edit" && doctorSpecialityQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading doctor speciality…
      </div>
    );
  }

  if (mode === "edit" && doctorSpecialityQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {doctorSpecialityQuery.error instanceof ApiError ? doctorSpecialityQuery.error.message : "Failed to load doctor speciality."}
      </p>
    );
  }

  return (
    <DoctorSpecialityForm
      mode={mode}
      doctorSpecialityId={doctorSpecialityId}
      initialDoctorSpeciality={doctorSpecialityQuery.data?.doctorSpeciality}
      onOpenChange={onOpenChange}
    />
  );
}

function DoctorSpecialityForm({
  mode,
  doctorSpecialityId,
  initialDoctorSpeciality,
  onOpenChange,
}: {
  mode: "create" | "edit";
  doctorSpecialityId: number | null;
  initialDoctorSpeciality?: DoctorSpeciality;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const languagesQuery = useQuery({ queryKey: languagesKeys.all, queryFn: listLanguages });
  const languages = languagesQuery.data?.languages ?? [];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<DoctorSpecialityFormValues>({
    resolver: zodResolver(doctorSpecialityFormSchema),
    defaultValues: {
      speciality_name: initialDoctorSpeciality?.speciality_name ?? "",
      language_id: initialDoctorSpeciality ? String(initialDoctorSpeciality.language_id) : "",
      seo_url: initialDoctorSpeciality?.seo_url ?? "",
      status: initialDoctorSpeciality?.status === "inactive" ? "inactive" : "active",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: DoctorSpecialityFormValues) => {
      const payload = {
        speciality_name: values.speciality_name,
        language_id: Number(values.language_id),
        seo_url: values.seo_url,
        status: values.status,
      };
      if (mode === "create") {
        return createDoctorSpeciality(payload);
      }
      return updateDoctorSpeciality(doctorSpecialityId as number, payload);
    },
    onSuccess: () => {
      notify.success(mode === "create" ? "Doctor speciality created successfully." : "Doctor speciality updated successfully.");
      queryClient.invalidateQueries({ queryKey: doctorSpecialitiesKeys.all });
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: DoctorSpecialityFormValues) => {
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
          <Field className="sm:col-span-2" data-invalid={!!errors.speciality_name || undefined}>
            <FieldLabel htmlFor="doctor-speciality-name">
              Speciality Name <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="doctor-speciality-name"
              aria-invalid={!!errors.speciality_name || undefined}
              {...register("speciality_name")}
            />
            <FieldError errors={[errors.speciality_name]} />
          </Field>

          <Field data-invalid={!!errors.language_id || undefined}>
            <FieldLabel htmlFor="doctor-speciality-language">
              Language <span className="text-destructive">*</span>
            </FieldLabel>
            <Controller
              name="language_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={languagesQuery.isLoading}>
                  <SelectTrigger id="doctor-speciality-language" className="w-full">
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

          <Field data-invalid={!!errors.status || undefined}>
            <FieldLabel htmlFor="doctor-speciality-status">Status</FieldLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="doctor-speciality-status" className="w-full">
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

          <Field className="sm:col-span-2" data-invalid={!!errors.seo_url || undefined}>
            <FieldLabel htmlFor="doctor-speciality-seo-url">
              SEO URL <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="doctor-speciality-seo-url"
              aria-invalid={!!errors.seo_url || undefined}
              {...register("seo_url")}
            />
            <FieldError errors={[errors.seo_url]} />
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
          {mode === "create" ? "Create Doctor Speciality" : "Save Changes"}
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
