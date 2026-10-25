"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/admin/FormDialog";
import { LoadingButton } from "@/components/admin/LoadingButton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldLabel } from "@/components/ui/field";
import { ApiError } from "@/lib/api/client";
import { listInsuranceCompanies } from "@/lib/api/insurance-companies";
import {
  addHospitalInsuranceCompany,
  listHospitalInsuranceCompanies,
  removeHospitalInsuranceCompany,
  reorderHospitalInsuranceCompanies,
} from "@/lib/api/hospital-insurance";
import { notify } from "@/lib/toast";
import { insuranceCompaniesKeys } from "@/components/admin/insurance-companies/queries";
import type { HospitalInsuranceMapping } from "@/types/hospital-insurance";

const hospitalInsuranceKey = (hospitalId: number) => ["hospital-insurance", hospitalId] as const;

type HospitalInsuranceDialogProps = {
  open: boolean;
  hospitalId: number | null;
  hospitalName?: string;
  onOpenChange: (open: boolean) => void;
};

/**
 * Hospital ↔ Insurance Company mapping management — search/select from
 * the shared `insurance_companies` taxonomy, assign, reorder, remove, or
 * toggle a mapping active/inactive. Never creates a new insurance
 * company record here; that stays on its own "Insurance Companies" CMS
 * module (see components/admin/insurance-companies/).
 */
export function HospitalInsuranceDialog({ open, hospitalId, hospitalName, onOpenChange }: HospitalInsuranceDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Manage Insurance"
      description={hospitalName ? `Hospital: ${hospitalName}` : undefined}
      className="sm:max-w-2xl"
    >
      {open && hospitalId !== null && <HospitalInsuranceBody hospitalId={hospitalId} />}
    </FormDialog>
  );
}

function HospitalInsuranceBody({ hospitalId }: { hospitalId: number }) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>("");

  const mappingsQuery = useQuery({
    queryKey: hospitalInsuranceKey(hospitalId),
    queryFn: () => listHospitalInsuranceCompanies(hospitalId),
  });
  const mappings = (mappingsQuery.data?.mappings ?? []).slice().sort((a, b) => a.sorting_order - b.sorting_order);

  const allInsuranceCompaniesQuery = useQuery({
    queryKey: insuranceCompaniesKeys.all,
    queryFn: () => listInsuranceCompanies({ status: "active" }),
  });

  const mappedIds = new Set(mappings.map((m) => m.insurance_company_id));
  const availableOptions = (allInsuranceCompaniesQuery.data?.insuranceCompanies ?? []).filter(
    (company) => !mappedIds.has(company.id)
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: hospitalInsuranceKey(hospitalId) });

  const addMutation = useMutation({
    mutationFn: (insuranceCompanyId: number) => addHospitalInsuranceCompany(hospitalId, insuranceCompanyId),
    onSuccess: () => {
      notify.success("Insurance company added.");
      setSelectedId("");
      invalidate();
    },
    onError: (error) => notify.apiError(error),
  });

  const reorderMutation = useMutation({
    mutationFn: (order: { insurance_company_id: number; sorting_order: number }[]) =>
      reorderHospitalInsuranceCompanies(hospitalId, { order }),
    onSuccess: invalidate,
    onError: (error) => {
      notify.apiError(error);
      invalidate();
    },
  });

  const removeMutation = useMutation({
    mutationFn: (insuranceCompanyId: number) => removeHospitalInsuranceCompany(hospitalId, insuranceCompanyId),
    onSuccess: () => {
      notify.success("Insurance company removed.");
      invalidate();
    },
    onError: (error) => notify.apiError(error),
  });

  function moveItem(index: number, direction: -1 | 1) {
    const target = mappings[index + direction];
    const current = mappings[index];
    if (!target || !current) return;
    reorderMutation.mutate([
      { insurance_company_id: current.insurance_company_id, sorting_order: target.sorting_order },
      { insurance_company_id: target.insurance_company_id, sorting_order: current.sorting_order },
    ]);
  }

  if (mappingsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading insurance mappings…
      </div>
    );
  }

  if (mappingsQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {mappingsQuery.error instanceof ApiError ? mappingsQuery.error.message : "Failed to load insurance mappings."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        {mappings.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">No insurance companies assigned yet.</p>
        ) : (
          mappings.map((mapping: HospitalInsuranceMapping, index) => (
            <div key={mapping.id} className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-3">
              {mapping.insurance_companies.logo ? (
                // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail only.
                <img
                  src={mapping.insurance_companies.logo}
                  alt=""
                  className="size-10 shrink-0 rounded-md border border-border object-contain"
                />
              ) : (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-body-sm font-medium text-foreground">
                {mapping.insurance_companies.name}
              </span>
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon-sm" disabled={index === 0} onClick={() => moveItem(index, -1)} aria-label="Move up">
                  <ChevronUp className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={index === mappings.length - 1}
                  onClick={() => moveItem(index, 1)}
                  aria-label="Move down"
                >
                  <ChevronDown className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeMutation.mutate(mapping.insurance_company_id)}
                  aria-label="Remove insurance company"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-4">
        <FieldLabel>Add Insurance Company</FieldLabel>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedId} onValueChange={setSelectedId} disabled={allInsuranceCompaniesQuery.isLoading}>
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue placeholder={availableOptions.length === 0 ? "No more companies available" : "Select a company"} />
            </SelectTrigger>
            <SelectContent>
              {availableOptions.map((company) => (
                <SelectItem key={company.id} value={String(company.id)}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <LoadingButton
            type="button"
            size="sm"
            loading={addMutation.isPending}
            disabled={!selectedId}
            onClick={() => addMutation.mutate(Number(selectedId))}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add
          </LoadingButton>
        </div>
        <p className="text-helper text-muted-foreground">
          Don&apos;t see the company you need? Create it first under Hospitals Management → Insurance Companies.
        </p>
      </div>
    </div>
  );
}
