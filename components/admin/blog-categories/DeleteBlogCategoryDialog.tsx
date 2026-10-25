"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteBlogCategory } from "@/lib/api/blog-categories";
import { notify } from "@/lib/toast";
import { blogCategoriesKeys } from "@/components/admin/blog-categories/queries";
import type { BlogCategory } from "@/types/blog-category";

type DeleteBlogCategoryDialogProps = {
  blogCategory: BlogCategory | null;
  onClose: () => void;
};

export function DeleteBlogCategoryDialog({ blogCategory, onClose }: DeleteBlogCategoryDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteBlogCategory(id),
    onSuccess: () => {
      notify.success("Blog category deleted successfully.");
      queryClient.invalidateQueries({ queryKey: blogCategoriesKeys.all });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete the blog category.");
    },
  });

  if (!blogCategory) return null;

  return (
    <DeleteConfirmDialog
      open={!!blogCategory}
      title="Delete blog category?"
      description={`Are you sure you want to delete "${blogCategory.category_name}"? This deactivates the category — it will no longer appear on the website, but the record is kept. This is refused if the category still has active blogs.`}
      confirmLabel="Delete Blog Category"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(blogCategory.id)}
      onCancel={onClose}
    />
  );
}
