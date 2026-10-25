"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { FormDialog } from "@/components/admin/FormDialog";
import { FormFieldGrid } from "@/components/admin/FormFieldGrid";
import { LoadingButton } from "@/components/admin/LoadingButton";
import { FileUploadArea } from "@/components/admin/FileUploadArea";
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
import { createInsuranceCompany, getInsuranceCompany, updateInsuranceCompany } from "@/lib/api/insurance-companies";
import { notify } from "@/lib/toast";
import { insuranceCompaniesKeys } from "@/components/admin/insurance-companies/queries";
import type { InsuranceCompany } from "@/types/insurance-company";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const IMAGE_HINT = "JPG, PNG, WEBP or GIF, up to 5MB";

// Mirrors validators/insurance-company.validator.ts's createInsuranceCompanySchema exactly.
const insuranceCompanyFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255, "Name is too long"),
  seo_url: z.string().trim().min(1, "SEO URL is required").max(255, "SEO URL is too long"),
  description: z.string().trim().optional(),
  status: z.enum(["active", "inactive"]),
});

type InsuranceCompanyFormValues = z.infer<typeof insuranceCompanyFormSchema>;

type InsuranceCompanyFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  insuranceCompanyId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function InsuranceCompanyFormDialog({ open, mode, insuranceCompanyId, onOpenChange }: InsuranceCompanyFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add Insurance Company" : "Edit Insurance Company"}
      description={mode === "create" ? "Create a new insurance company." : "Update this insurance company's details."}
    >
      {open && (
        <InsuranceCompanyFormBody
          key={mode === "edit" ? (insuranceCompanyId ?? "edit") : "create"}
          mode={mode}
          insuranceCompanyId={insuranceCompanyId}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function InsuranceCompanyFormBody({
  mode,
  insuranceCompanyId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  insuranceCompanyId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [logoFiles, setLogoFiles] = useState<File[]>([]);

  const detailQuery = useQuery({
    queryKey: insuranceCompaniesKeys.detail(insuranceCompanyId ?? -1),
    queryFn: () => getInsuranceCompany(insuranceCompanyId as number),
    enabled: mode === "edit" && insuranceCompanyId !== null,
  });
  const initial: InsuranceCompany | undefined = detailQuery.data?.insuranceCompany;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<InsuranceCompanyFormValues>({
    resolver: zodResolver(insuranceCompanyFormSchema),
    defaultValues: {
      name: initial?.name ?? "",
      seo_url: initial?.seo_url ?? "",
      description: initial?.description ?? "",
      status: initial?.status ?? "active",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: InsuranceCompanyFormValues) => {
      const payload = {
        name: values.name,
        seo_url: values.seo_url,
        description: values.description ? values.description : null,
        status: values.status,
      };
      if (mode === "create") {
        return createInsuranceCompany(payload, logoFiles[0]);
      }
      return updateInsuranceCompany(insuranceCompanyId as number, payload, logoFiles[0]);
    },
    onSuccess: () => {
      notify.success(mode === "create" ? "Insurance company created successfully." : "Insurance company updated successfully.");
      queryClient.invalidateQueries({ queryKey: insuranceCompaniesKeys.all });
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  if (mode === "edit" && detailQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading insurance company…
      </div>
    );
  }

  if (mode === "edit" && detailQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {detailQuery.error instanceof ApiError ? detailQuery.error.message : "Failed to load insurance company."}
      </p>
    );
  }

  const onSubmit = (values: InsuranceCompanyFormValues) => {
    mutation.mutate(values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {mutation.isError && (
        <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {mutation.error instanceof ApiError ? mutation.error.message : "Something went wrong."}
        </div>
      )}

      <FormFieldGrid>
        <Field className="sm:col-span-2" data-invalid={!!errors.name || undefined}>
          <FieldLabel htmlFor="insurance-name">
            Name <span className="text-destructive">*</span>
          </FieldLabel>
          <Input id="insurance-name" aria-invalid={!!errors.name || undefined} {...register("name")} />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field className="sm:col-span-2" data-invalid={!!errors.seo_url || undefined}>
          <FieldLabel htmlFor="insurance-seo-url">
            SEO URL <span className="text-destructive">*</span>
          </FieldLabel>
          <Input id="insurance-seo-url" aria-invalid={!!errors.seo_url || undefined} {...register("seo_url")} />
          <FieldError errors={[errors.seo_url]} />
        </Field>

        <Field data-invalid={!!errors.status || undefined}>
          <FieldLabel htmlFor="insurance-status">Status</FieldLabel>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="insurance-status" className="w-full">
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

        <Field className="sm:col-span-2" data-invalid={!!errors.description || undefined}>
          <FieldLabel htmlFor="insurance-description">
            Description <span className="text-muted-foreground">(optional)</span>
          </FieldLabel>
          <Textarea id="insurance-description" rows={3} {...register("description")} />
          <FieldError errors={[errors.description]} />
        </Field>

        <Field className="sm:col-span-2">
          <FieldLabel>
            Logo <span className="text-muted-foreground">(optional)</span>
          </FieldLabel>
          {mode === "edit" && initial?.logo && logoFiles.length === 0 && (
            <div className="mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- small preview of the currently stored logo. */}
              <img src={initial.logo} alt="" className="size-12 rounded-md border border-border object-contain" />
            </div>
          )}
          <FileUploadArea files={logoFiles} onFilesChange={setLogoFiles} accept={IMAGE_ACCEPT} hint={IMAGE_HINT} disabled={mutation.isPending} />
        </Field>
      </FormFieldGrid>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting || mutation.isPending}>
          Cancel
        </Button>
        <LoadingButton type="submit" disabled={isSubmitting} loading={mutation.isPending}>
          {mode === "create" ? "Create Insurance Company" : "Save Changes"}
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
