"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { ApiError } from "@/lib/api/client";
import { updateBookaformData } from "@/lib/api/leads";
import { notify } from "@/lib/toast";
import { leadsKeys } from "@/components/admin/leads/queries";
import type { BookaformData } from "@/types/lead";

// Mirrors validators/bookaform.validator.ts's updateBookaformDataSchema exactly.
const bookaformDataFormSchema = z.object({
  data_from: z.string().trim().min(1, "This field is required").max(255, "Value is too long"),
  status: z.enum(["active", "inactive"]),
});

type BookaformDataFormValues = z.infer<typeof bookaformDataFormSchema>;

type BookaformDataFormDialogProps = {
  record: BookaformData | null;
  onClose: () => void;
};

export function BookaformDataFormDialog({ record, onClose }: BookaformDataFormDialogProps) {
  return (
    <FormDialog
      open={!!record}
      onOpenChange={(open) => !open && onClose()}
      title="Edit Book-a-Form Submission"
      description="Update this submission's details."
    >
      {record && <BookaformDataForm key={record.id} record={record} onClose={onClose} />}
    </FormDialog>
  );
}

function BookaformDataForm({ record, onClose }: { record: BookaformData; onClose: () => void }) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BookaformDataFormValues>({
    resolver: zodResolver(bookaformDataFormSchema),
    defaultValues: {
      data_from: record.data_from,
      status: record.status,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: BookaformDataFormValues) => updateBookaformData(record.id, values),
    onSuccess: () => {
      notify.success("Book-a-Form submission updated successfully.");
      queryClient.invalidateQueries({ queryKey: leadsKeys.bookaform });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: BookaformDataFormValues) => {
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

      <FieldGroup className="gap-4">
        <Field data-invalid={!!errors.data_from || undefined}>
          <FieldLabel htmlFor="bookaform-data-from">
            Submitted From <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="bookaform-data-from"
            aria-invalid={!!errors.data_from || undefined}
            {...register("data_from")}
          />
          <FieldError errors={[errors.data_from]} />
        </Field>

        <Field data-invalid={!!errors.status || undefined}>
          <FieldLabel htmlFor="bookaform-status">Status</FieldLabel>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="bookaform-status" className="w-full">
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
      </FieldGroup>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting || mutation.isPending}
        >
          Cancel
        </Button>
        <LoadingButton type="submit" disabled={isSubmitting} loading={mutation.isPending}>
          Save Changes
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
