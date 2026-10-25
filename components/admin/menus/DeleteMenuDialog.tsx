"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteMenu } from "@/lib/api/menus";
import { notify } from "@/lib/toast";
import { menusKeys } from "@/components/admin/menus/queries";
import type { Menu } from "@/types/menu";

type DeleteMenuDialogProps = {
  menu: Menu | null;
  onClose: () => void;
};

export function DeleteMenuDialog({ menu, onClose }: DeleteMenuDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteMenu(id),
    onSuccess: () => {
      notify.success("Menu deleted successfully.");
      queryClient.invalidateQueries({ queryKey: menusKeys.all });
      onClose();
    },
    onError: (error) => {
      // Surfaced verbatim: the backend returns 409 with a clear message if
      // this menu still has active children, rather than being special-cased here.
      notify.apiError(error, "Failed to delete the menu.");
    },
  });

  if (!menu) return null;

  return (
    <DeleteConfirmDialog
      open={!!menu}
      title="Delete menu?"
      description={`Are you sure you want to delete "${menu.title}"? This deactivates the menu — it will no longer appear in navigation, but the record is kept. Menus with active child items cannot be deleted until those children are removed first.`}
      confirmLabel="Delete Menu"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(menu.id)}
      onCancel={onClose}
    />
  );
}
