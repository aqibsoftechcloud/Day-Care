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
import { createJsConfiguration, getJsConfiguration, updateJsConfiguration } from "@/lib/api/js-configurations";
import { notify } from "@/lib/toast";
import { jsConfigurationsKeys } from "@/components/admin/js-configurations/queries";
import type { JsConfiguration } from "@/types/js-configuration";

// Mirrors validators/js-configuration.validator.ts's createJsConfigurationSchema
// exactly. config_code is intentionally NOT trimmed — it's stored/executed
// code on the live site, preserved exactly as submitted (matching the
// validator's own comment), never treated as rich text or run in this UI.
const jsConfigurationFormSchema = z.object({
  config_for: z.enum(["header", "footer"]),
  config_type: z.string().trim().min(1, "Config type is required").max(100, "Config type is too long"),
  config_code: z.string().min(1, "Config code is required"),
  status: z.enum(["active", "inactive"]),
});

type JsConfigurationFormValues = z.infer<typeof jsConfigurationFormSchema>;

type JsConfigurationFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  jsConfigurationId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function JsConfigurationFormDialog({ open, mode, jsConfigurationId, onOpenChange }: JsConfigurationFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add JS Configuration" : "Edit JS Configuration"}
      description={mode === "create" ? "Create a new JS configuration." : "Update this JS configuration's details."}
      className="sm:max-w-2xl"
    >
      {open && (
        <JsConfigurationFormBody
          key={mode === "edit" ? (jsConfigurationId ?? "edit") : "create"}
          mode={mode}
          jsConfigurationId={jsConfigurationId}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function JsConfigurationFormBody({
  mode,
  jsConfigurationId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  jsConfigurationId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const jsConfigurationQuery = useQuery({
    queryKey: jsConfigurationsKeys.detail(jsConfigurationId ?? -1),
    queryFn: () => getJsConfiguration(jsConfigurationId as number),
    enabled: mode === "edit" && jsConfigurationId !== null,
  });

  if (mode === "edit" && jsConfigurationQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading JS configuration…
      </div>
    );
  }

  if (mode === "edit" && jsConfigurationQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {jsConfigurationQuery.error instanceof ApiError ? jsConfigurationQuery.error.message : "Failed to load JS configuration."}
      </p>
    );
  }

  return (
    <JsConfigurationForm
      mode={mode}
      jsConfigurationId={jsConfigurationId}
      initialJsConfiguration={jsConfigurationQuery.data?.jsConfiguration}
      onOpenChange={onOpenChange}
    />
  );
}

function JsConfigurationForm({
  mode,
  jsConfigurationId,
  initialJsConfiguration,
  onOpenChange,
}: {
  mode: "create" | "edit";
  jsConfigurationId: number | null;
  initialJsConfiguration?: JsConfiguration;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<JsConfigurationFormValues>({
    resolver: zodResolver(jsConfigurationFormSchema),
    defaultValues: {
      config_for: initialJsConfiguration?.config_for ?? "header",
      config_type: initialJsConfiguration?.config_type ?? "",
      config_code: initialJsConfiguration?.config_code ?? "",
      status: initialJsConfiguration?.status === "inactive" ? "inactive" : "active",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: JsConfigurationFormValues) => {
      const payload = {
        config_for: values.config_for,
        config_type: values.config_type,
        // Sent exactly as typed — never trimmed/transformed, matching the backend's own handling.
        config_code: values.config_code,
        status: values.status,
      };
      if (mode === "create") {
        return createJsConfiguration(payload);
      }
      return updateJsConfiguration(jsConfigurationId as number, payload);
    },
    onSuccess: () => {
      notify.success(mode === "create" ? "JS configuration created successfully." : "JS configuration updated successfully.");
      queryClient.invalidateQueries({ queryKey: jsConfigurationsKeys.all });
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: JsConfigurationFormValues) => {
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
        <Field data-invalid={!!errors.config_type || undefined}>
          <FieldLabel htmlFor="js-config-type">
            Config Type <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="js-config-type"
            placeholder="e.g. analytics, chat-widget"
            aria-invalid={!!errors.config_type || undefined}
            {...register("config_type")}
          />
          <FieldError errors={[errors.config_type]} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.config_for || undefined}>
            <FieldLabel htmlFor="js-config-for">
              Config For <span className="text-destructive">*</span>
            </FieldLabel>
            <Controller
              name="config_for"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="js-config-for" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="header">Header</SelectItem>
                    <SelectItem value="footer">Footer</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.config_for]} />
          </Field>

          <Field data-invalid={!!errors.status || undefined}>
            <FieldLabel htmlFor="js-config-status">Status</FieldLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="js-config-status" className="w-full">
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
        </div>

        <Field data-invalid={!!errors.config_code || undefined}>
          <FieldLabel htmlFor="js-config-code">
            Config Code <span className="text-destructive">*</span>
          </FieldLabel>
          <Textarea
            id="js-config-code"
            rows={14}
            spellCheck={false}
            placeholder="<script>...</script> or raw JavaScript"
            aria-invalid={!!errors.config_code || undefined}
            className="font-mono text-body-sm whitespace-pre"
            {...register("config_code")}
          />
          <p className="text-helper">
            Stored and injected exactly as entered — this is code, not rich text, and is never executed inside this admin UI.
          </p>
          <FieldError errors={[errors.config_code]} />
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
          {mode === "create" ? "Create JS Configuration" : "Save Changes"}
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
