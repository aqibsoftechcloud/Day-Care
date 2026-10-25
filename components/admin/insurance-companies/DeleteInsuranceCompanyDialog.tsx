"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { deleteInsuranceCompany } from "@/lib/api/insurance-companies";
import { notify } from "@/lib/toast";
import { insuranceCompaniesKeys } from "@/components/admin/insurance-companies/queries";
import type { InsuranceCompany } from "@/types/insurance-company";

type DeleteInsuranceCompanyDialogProps = {
  insuranceCompany: InsuranceCompany | null;
  onClose: () => void;
};

/** Hard delete — the backend refuses (400) if this company is still mapped to any hospital, so the error message already explains what to do: remove it from those hospitals first. */
export function DeleteInsuranceCompanyDialog({ insuranceCompany, onClose }: DeleteInsuranceCompanyDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deleteInsuranceCompany(id),
    onSuccess: () => {
      notify.success("Insurance company deleted successfully.");
      queryClient.invalidateQueries({ queryKey: insuranceCompaniesKeys.all });
      onClose();
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete the insurance company.");
    },
  });

  if (!insuranceCompany) return null;

  return (
    <DeleteConfirmDialog
      open={!!insuranceCompany}
      title="Delete insurance company?"
      description={`Are you sure you want to permanently delete "${insuranceCompany.name}"? This cannot be undone.`}
      confirmLabel="Delete Insurance Company"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(insuranceCompany.id)}
      onCancel={onClose}
    />
  );
}
