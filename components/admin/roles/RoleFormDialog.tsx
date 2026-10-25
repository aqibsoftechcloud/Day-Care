"use client";

import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/admin/LoadingButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { ApiError } from "@/lib/api/client";
import { createRole, getRole, updateRole } from "@/lib/api/roles";
import { notify } from "@/lib/toast";
import { rolesKeys } from "@/components/admin/roles/queries";
import type { Role } from "@/types/role";

// Mirrors validators/role.validator.ts's createRoleSchema exactly.
const roleFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().trim().max(255, "Description is too long").optional(),
  status: z.enum(["active", "inactive"]),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

type RoleFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  roleId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function RoleFormDialog({ open, mode, roleId, onOpenChange }: RoleFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" expandable>
        <DialogHeader className="pr-16">
          <DialogTitle>{mode === "create" ? "Add Role" : "Edit Role"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new administrator role."
              : "Update this role's details."}
          </DialogDescription>
        </DialogHeader>

        {/* Keyed by role so re-opening for a different role remounts with
            fresh defaultValues instead of needing a reset-in-effect. */}
        {open && (
          <RoleFormBody
            key={mode === "edit" ? (roleId ?? "edit") : "create"}
            mode={mode}
            roleId={roleId}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RoleFormBody({
  mode,
  roleId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  roleId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const roleQuery = useQuery({
    queryKey: rolesKeys.detail(roleId ?? -1),
    queryFn: () => getRole(roleId as number),
    enabled: mode === "edit" && roleId !== null,
  });

  if (mode === "edit" && roleQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading role…
      </div>
    );
  }

  if (mode === "edit" && roleQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {roleQuery.error instanceof ApiError
          ? roleQuery.error.message
          : "Failed to load role."}
      </p>
    );
  }

  return (
    <RoleForm
      mode={mode}
      roleId={roleId}
      initialRole={roleQuery.data?.role}
      onOpenChange={onOpenChange}
    />
  );
}

function RoleForm({
  mode,
  roleId,
  initialRole,
  onOpenChange,
}: {
  mode: "create" | "edit";
  roleId: number | null;
  initialRole?: Role;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: initialRole?.name ?? "",
      description: initialRole?.description ?? "",
      status: (initialRole?.status === "inactive" ? "inactive" : "active"),
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: RoleFormValues) => {
      const payload = {
        name: values.name,
        description: values.description ? values.description : null,
        status: values.status,
      };
      if (mode === "create") {
        return createRole(payload);
      }
      return updateRole(roleId as number, payload);
    },
    onSuccess: () => {
      notify.success(mode === "create" ? "Role created successfully." : "Role updated successfully.");
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: RoleFormValues) => {
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
        <FieldLegend variant="label" className="text-[13px] font-semibold text-foreground">
          Role Information
        </FieldLegend>
        <FieldGroup className="gap-4">
          <Field data-invalid={!!errors.name || undefined}>
            <FieldLabel htmlFor="role-name">
              Role Name <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="role-name"
              placeholder="e.g. Content Editor"
              aria-invalid={!!errors.name || undefined}
              {...register("name")}
            />
            <FieldError errors={[errors.name]} />
          </Field>

          <Field data-invalid={!!errors.status || undefined}>
            <FieldLabel htmlFor="role-status">Status</FieldLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="role-status" className="w-full">
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

          <Field data-invalid={!!errors.description || undefined}>
            <FieldLabel htmlFor="role-description">
              Description <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Textarea
              id="role-description"
              rows={3}
              placeholder="What this role is for"
              aria-invalid={!!errors.description || undefined}
              {...register("description")}
            />
            <FieldError errors={[errors.description]} />
          </Field>
        </FieldGroup>
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
          {mode === "create" ? "Create Role" : "Save Changes"}
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
