"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteTestimonial } from "@/lib/api/testimonials";
import { notify } from "@/lib/toast";
import { testimonialsKeys } from "@/components/admin/testimonials/queries";
import type { Testimonial } from "@/types/testimonial";

type DeleteTestimonialDialogProps = {
  testimonial: Testimonial | null;
  onClose: () => void;
};

export function DeleteTestimonialDialog({ testimonial, onClose }: DeleteTestimonialDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteTestimonial(id),
    onSuccess: () => {
      notify.success("Testimonial deleted successfully.");
      queryClient.invalidateQueries({ queryKey: testimonialsKeys.all });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete the testimonial.");
    },
  });

  if (!testimonial) return null;

  return (
    <DeleteConfirmDialog
      open={!!testimonial}
      title="Delete testimonial?"
      description={`Are you sure you want to delete "${testimonial.testimonial_name}"? This deactivates the testimonial — it will no longer appear on the website, but the record is kept.`}
      confirmLabel="Delete Testimonial"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(testimonial.id)}
      onCancel={onClose}
    />
  );
}
