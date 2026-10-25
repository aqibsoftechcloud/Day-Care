"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteRole } from "@/lib/api/roles";
import { notify } from "@/lib/toast";
import { rolesKeys } from "@/components/admin/roles/queries";
import type { Role } from "@/types/role";

type DeleteRoleDialogProps = {
  role: Role | null;
  onClose: () => void;
};

export function DeleteRoleDialog({ role, onClose }: DeleteRoleDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteRole(id),
    onSuccess: () => {
      notify.success("Role deleted successfully.");
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
      onClose();
    },
    onError: (error) => {
      // Whatever the backend actually reports (e.g. a foreign-key conflict
      // from users still assigned to this role) is surfaced verbatim — the
      // row is never removed from the list until the call actually succeeds.
      notify.apiError(error, "Failed to delete the role.");
    },
  });

  if (!role) return null;

  return (
    <DeleteConfirmDialog
      open={!!role}
      title="Delete role?"
      description={`Are you sure you want to delete "${role.name}"? This action cannot be undone.`}
      confirmLabel="Delete Role"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(role.id)}
      onCancel={onClose}
    />
  );
}
