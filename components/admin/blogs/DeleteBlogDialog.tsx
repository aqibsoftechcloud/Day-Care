"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteBlog } from "@/lib/api/blogs";
import { notify } from "@/lib/toast";
import { blogsKeys } from "@/components/admin/blogs/queries";
import type { Blog } from "@/types/blog";

type DeleteBlogDialogProps = {
  blog: Blog | null;
  onClose: () => void;
};

export function DeleteBlogDialog({ blog, onClose }: DeleteBlogDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteBlog(id),
    onSuccess: () => {
      notify.success("Blog deleted successfully.");
      queryClient.invalidateQueries({ queryKey: blogsKeys.all });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete the blog.");
    },
  });

  if (!blog) return null;

  return (
    <DeleteConfirmDialog
      open={!!blog}
      title="Delete blog?"
      description={`Are you sure you want to delete "${blog.blog_title}"? This deactivates the blog — it will no longer appear on the website, but the record and its FAQs are kept.`}
      confirmLabel="Delete Blog"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(blog.id)}
      onCancel={onClose}
    />
  );
}
