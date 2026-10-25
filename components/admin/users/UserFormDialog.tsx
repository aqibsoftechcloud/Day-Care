"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ApiError } from "@/lib/api/client";
import { createUser, getUser, updateUser } from "@/lib/api/users";
import { listRoles } from "@/lib/api/roles";
import { notify } from "@/lib/toast";
import { usersKeys } from "@/components/admin/users/queries";
import { rolesKeys } from "@/components/admin/roles/queries";
import type { UpdateUserInput, User } from "@/types/user";

// role_id is kept as a string here to match shadcn Select's string-based
// value model — converted to a number only when building the API payload.
// password is always optional at this layer: create-mode "required" is
// enforced manually in onSubmit rather than via a second zod schema, so
// this form doesn't need two incompatible RHF generic types.
const userFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150, "Name is too long"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  role_id: z.string().min(1, "Role is required"),
  status: z.enum(["active", "inactive"]),
  password: z.string().optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

type UserFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  userId: string | null;
  onOpenChange: (open: boolean) => void;
};

export function UserFormDialog({ open, mode, userId, onOpenChange }: UserFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add User" : "Edit User"}
      description={
        mode === "create" ? "Create a new administrator user." : "Update this user's details."
      }
    >
      {/* Keyed by user so re-opening for a different user remounts with
          fresh defaultValues instead of needing a reset-in-effect. */}
      {open && (
        <UserFormBody
          key={mode === "edit" ? (userId ?? "edit") : "create"}
          mode={mode}
          userId={userId}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function UserFormBody({
  mode,
  userId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  userId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const userQuery = useQuery({
    queryKey: usersKeys.detail(userId ?? ""),
    queryFn: () => getUser(userId as string),
    enabled: mode === "edit" && userId !== null,
  });

  if (mode === "edit" && userQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading user…
      </div>
    );
  }

  if (mode === "edit" && userQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {userQuery.error instanceof ApiError ? userQuery.error.message : "Failed to load user."}
      </p>
    );
  }

  return (
    <UserForm
      mode={mode}
      userId={userId}
      initialUser={userQuery.data?.user}
      onOpenChange={onOpenChange}
    />
  );
}

function UserForm({
  mode,
  userId,
  initialUser,
  onOpenChange,
}: {
  mode: "create" | "edit";
  userId: string | null;
  initialUser?: User;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  const rolesQuery = useQuery({ queryKey: rolesKeys.all, queryFn: listRoles });
  const roles = rolesQuery.data?.roles ?? [];

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: initialUser?.name ?? "",
      email: initialUser?.email ?? "",
      role_id: initialUser ? String(initialUser.role_id) : "",
      status: initialUser?.status === "inactive" ? "inactive" : "active",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      if (mode === "create") {
        return createUser({
          name: values.name,
          email: values.email,
          password: values.password as string,
          role_id: Number(values.role_id),
          status: values.status,
        });
      }

      const payload: UpdateUserInput = {
        name: values.name,
        email: values.email,
        role_id: Number(values.role_id),
        status: values.status,
      };
      // Blank password means "keep the current password" — the field is
      // omitted from the payload entirely rather than sent as "", matching
      // updateUserSchema's partial()/optional() contract.
      if (values.password) payload.password = values.password;

      return updateUser(userId as string, payload);
    },
    onSuccess: () => {
      notify.success(mode === "create" ? "User created successfully." : "User updated successfully.");
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: UserFormValues) => {
    if (mode === "create" && !values.password) {
      setError("password", { message: "Password is required" });
      return;
    }
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
          User Information
        </FieldLegend>
        <FieldGroup className="gap-4">
          <Field data-invalid={!!errors.name || undefined}>
            <FieldLabel htmlFor="user-name">
              Name <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="user-name"
              placeholder="e.g. Jane Doe"
              aria-invalid={!!errors.name || undefined}
              {...register("name")}
            />
            <FieldError errors={[errors.name]} />
          </Field>

          <Field data-invalid={!!errors.email || undefined}>
            <FieldLabel htmlFor="user-email">
              Email <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="user-email"
              type="email"
              autoComplete="off"
              placeholder="name@example.com"
              aria-invalid={!!errors.email || undefined}
              {...register("email")}
            />
            <FieldError errors={[errors.email]} />
          </Field>

          <Field data-invalid={!!errors.role_id || undefined}>
            <FieldLabel htmlFor="user-role">
              Role <span className="text-destructive">*</span>
            </FieldLabel>
            <Controller
              name="role_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={rolesQuery.isLoading}>
                  <SelectTrigger id="user-role" className="w-full">
                    <SelectValue placeholder={rolesQuery.isLoading ? "Loading roles…" : "Select a role"} />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={String(role.id)}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.role_id]} />
          </Field>

          <Field data-invalid={!!errors.status || undefined}>
            <FieldLabel htmlFor="user-status">Status</FieldLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="user-status" className="w-full">
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

          <Field data-invalid={!!errors.password || undefined}>
            <FieldLabel htmlFor="user-password">
              {mode === "create" ? (
                <>
                  Password <span className="text-destructive">*</span>
                </>
              ) : (
                <>
                  New Password <span className="text-muted-foreground">(optional)</span>
                </>
              )}
            </FieldLabel>
            <div className="relative">
              <Input
                id="user-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={mode === "create" ? "Enter a password" : "Leave blank to keep current password"}
                aria-invalid={!!errors.password || undefined}
                className="pr-9"
                {...register("password")}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute top-1/2 right-1.5 flex size-6 -translate-y-1/2 items-center justify-center text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">{showPassword ? "Hide password" : "Show password"}</TooltipContent>
              </Tooltip>
            </div>
            <FieldError errors={[errors.password]} />
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
          {mode === "create" ? "Create User" : "Save Changes"}
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
