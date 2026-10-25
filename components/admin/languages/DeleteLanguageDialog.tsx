"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteLanguage } from "@/lib/api/languages";
import { notify } from "@/lib/toast";
import { languagesKeys } from "@/components/admin/languages/queries";
import type { Language } from "@/types/language";

type DeleteLanguageDialogProps = {
  language: Language | null;
  onClose: () => void;
};

export function DeleteLanguageDialog({ language, onClose }: DeleteLanguageDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteLanguage(id),
    onSuccess: () => {
      notify.success("Language deleted successfully.");
      queryClient.invalidateQueries({ queryKey: languagesKeys.all });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete the language.");
    },
  });

  if (!language) return null;

  return (
    <DeleteConfirmDialog
      open={!!language}
      title="Delete language?"
      description={`Are you sure you want to delete "${language.name}"? This deactivates the language — content using it is kept, but the record is marked inactive.`}
      confirmLabel="Delete Language"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(language.id)}
      onCancel={onClose}
    />
  );
}
