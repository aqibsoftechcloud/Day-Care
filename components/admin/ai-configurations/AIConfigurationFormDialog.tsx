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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { ApiError } from "@/lib/api/client";
import {
  createAIConfiguration,
  getAIConfiguration,
  updateAIConfiguration,
} from "@/lib/api/ai-configurations";
import { notify } from "@/lib/toast";
import { aiConfigurationsKeys } from "@/components/admin/ai-configurations/queries";
import type { AIConfiguration, AIConfigurationProvider } from "@/types/ai-configuration";

// Kept in sync with lib/ai/providers/registry.ts's PROVIDER_DEFAULT_BASE_URL —
// duplicated here (not imported) because that file is server-only (it's
// part of the provider adapter graph); this is just the starting value the
// form pre-fills when a provider is first selected, not a source of truth
// the backend trusts — the server re-validates the actual submitted value
// against its own allowlist regardless of what the form sends.
const PROVIDER_DEFAULT_BASE_URL: Record<AIConfigurationProvider, string> = {
  openrouter: "https://openrouter.ai/api/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta",
};

const PROVIDER_LABELS: Record<AIConfigurationProvider, string> = {
  openrouter: "OpenRouter",
  gemini: "Gemini",
};

// Mirrors validators/ai-configuration.validator.ts's createAIConfigurationSchema.
const aiConfigurationFormSchema = z.object({
  provider: z.enum(["openrouter", "gemini"]),
  base_url: z.string().trim().min(1, "Base URL is required").max(500, "Base URL is too long").url("Enter a valid URL"),
  model: z.string().trim().min(1, "Model is required").max(255, "Model is too long"),
  api_key: z.string().trim().max(2000, "API key is too long"),
  status: z.enum(["active", "inactive"]),
});

type AIConfigurationFormValues = z.infer<typeof aiConfigurationFormSchema>;

type AIConfigurationFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  configId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function AIConfigurationFormDialog({ open, mode, configId, onOpenChange }: AIConfigurationFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add AI Configuration" : "Edit AI Configuration"}
      description={
        mode === "create"
          ? "Create a new AI provider configuration."
          : "Update this AI provider configuration."
      }
      className="sm:max-w-2xl"
    >
      {open && (
        <AIConfigurationFormBody
          key={mode === "edit" ? (configId ?? "edit") : "create"}
          mode={mode}
          configId={configId}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function AIConfigurationFormBody({
  mode,
  configId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  configId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const configQuery = useQuery({
    queryKey: aiConfigurationsKeys.detail(configId ?? -1),
    queryFn: () => getAIConfiguration(configId as number),
    enabled: mode === "edit" && configId !== null,
  });

  if (mode === "edit" && configQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading configuration…
      </div>
    );
  }

  if (mode === "edit" && configQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {configQuery.error instanceof ApiError ? configQuery.error.message : "Failed to load configuration."}
      </p>
    );
  }

  return (
    <AIConfigurationForm
      mode={mode}
      configId={configId}
      initialConfig={configQuery.data?.aiConfiguration}
      onOpenChange={onOpenChange}
    />
  );
}

function AIConfigurationForm({
  mode,
  configId,
  initialConfig,
  onOpenChange,
}: {
  mode: "create" | "edit";
  configId: number | null;
  initialConfig?: AIConfiguration;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AIConfigurationFormValues>({
    resolver: zodResolver(aiConfigurationFormSchema),
    defaultValues: {
      provider: initialConfig?.provider ?? "openrouter",
      base_url: initialConfig?.base_url ?? PROVIDER_DEFAULT_BASE_URL.openrouter,
      model: initialConfig?.model ?? "",
      api_key: "",
      status: initialConfig?.status === "inactive" ? "inactive" : "active",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: AIConfigurationFormValues) => {
      const payload = {
        provider: values.provider,
        base_url: values.base_url,
        model: values.model,
        status: values.status,
        ...(values.api_key ? { api_key: values.api_key } : {}),
      };
      if (mode === "create") {
        return createAIConfiguration(payload);
      }
      return updateAIConfiguration(configId as number, payload);
    },
    onSuccess: () => {
      notify.success(mode === "create" ? "AI configuration created successfully." : "AI configuration updated successfully.");
      queryClient.invalidateQueries({ queryKey: aiConfigurationsKeys.all });
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: AIConfigurationFormValues) => {
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

      <FormFieldGrid>
        <Field data-invalid={!!errors.provider || undefined}>
          <FieldLabel htmlFor="ai-config-provider">
            Provider <span className="text-destructive">*</span>
          </FieldLabel>
          <Controller
            name="provider"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  setValue("base_url", PROVIDER_DEFAULT_BASE_URL[value as AIConfigurationProvider]);
                }}
              >
                <SelectTrigger id="ai-config-provider" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PROVIDER_LABELS) as AIConfigurationProvider[]).map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {PROVIDER_LABELS[provider]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.provider]} />
        </Field>

        <Field data-invalid={!!errors.model || undefined}>
          <FieldLabel htmlFor="ai-config-model">
            Model <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="ai-config-model"
            placeholder="e.g. gemini-2.5-flash"
            aria-invalid={!!errors.model || undefined}
            {...register("model")}
          />
          <FieldError errors={[errors.model]} />
        </Field>

        <Field className="sm:col-span-2" data-invalid={!!errors.base_url || undefined}>
          <FieldLabel htmlFor="ai-config-base-url">
            Base URL <span className="text-destructive">*</span>
          </FieldLabel>
          <Input id="ai-config-base-url" aria-invalid={!!errors.base_url || undefined} {...register("base_url")} />
          <FieldError errors={[errors.base_url]} />
        </Field>

        <Field className="sm:col-span-2" data-invalid={!!errors.api_key || undefined}>
          <FieldLabel htmlFor="ai-config-api-key">
            API Key {mode === "edit" && <span className="text-muted-foreground">(optional)</span>}
          </FieldLabel>
          <Input
            id="ai-config-api-key"
            type="password"
            autoComplete="new-password"
            placeholder={mode === "edit" && initialConfig?.has_api_key ? "••••••••••••••••" : "Enter the provider API key"}
            aria-invalid={!!errors.api_key || undefined}
            {...register("api_key")}
          />
          <p className="text-helper">
            {mode === "edit"
              ? "Leave blank to keep the existing key. The stored key is never shown or sent back to the browser."
              : "Stored encrypted. It will not be shown again after saving — you can replace it later from Edit."}
          </p>
          <FieldError errors={[errors.api_key]} />
        </Field>

        <Field data-invalid={!!errors.status || undefined}>
          <FieldLabel htmlFor="ai-config-status">Status</FieldLabel>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="ai-config-status" className="w-full">
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
          {mode === "create" ? "Create Configuration" : "Save Changes"}
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
