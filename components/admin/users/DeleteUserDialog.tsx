"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteUser } from "@/lib/api/users";
import { notify } from "@/lib/toast";
import { usersKeys } from "@/components/admin/users/queries";
import type { User } from "@/types/user";

type DeleteUserDialogProps = {
  user: User | null;
  onClose: () => void;
};

export function DeleteUserDialog({ user, onClose }: DeleteUserDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      notify.success("User deleted successfully.");
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete the user.");
    },
  });

  if (!user) return null;

  return (
    <DeleteConfirmDialog
      open={!!user}
      title="Delete user?"
      description={`Are you sure you want to delete "${user.name}"? This deactivates their account — they will no longer be able to sign in, but the record is kept.`}
      confirmLabel="Delete User"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(user.user_id)}
      onCancel={onClose}
    />
  );
}
