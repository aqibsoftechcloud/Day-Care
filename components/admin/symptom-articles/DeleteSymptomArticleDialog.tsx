"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteSymptomArticle } from "@/lib/api/symptom-articles";
import { notify } from "@/lib/toast";
import { symptomArticlesKeys } from "@/components/admin/symptom-articles/queries";
import type { SymptomArticle } from "@/types/symptom-article";

type DeleteSymptomArticleDialogProps = {
  article: SymptomArticle | null;
  onClose: () => void;
};

export function DeleteSymptomArticleDialog({ article, onClose }: DeleteSymptomArticleDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteSymptomArticle(id),
    onSuccess: () => {
      notify.success("Article deleted successfully.");
      queryClient.invalidateQueries({ queryKey: symptomArticlesKeys.all });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete the article.");
    },
  });

  if (!article) return null;

  return (
    <DeleteConfirmDialog
      open={!!article}
      title="Delete article?"
      description={`Are you sure you want to delete "${article.article_name}"? This deactivates the article — it will no longer appear on the website, but the record is kept.`}
      confirmLabel="Delete Article"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(article.id)}
      onCancel={onClose}
    />
  );
}
