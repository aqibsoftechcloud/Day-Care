"use client";

import { useState } from "react";
import { Plus, ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { InsuranceCompaniesTable } from "@/components/admin/insurance-companies/InsuranceCompaniesTable";
import { InsuranceCompanyFormDialog } from "@/components/admin/insurance-companies/InsuranceCompanyFormDialog";
import { DeleteInsuranceCompanyDialog } from "@/components/admin/insurance-companies/DeleteInsuranceCompanyDialog";
import { insuranceCompaniesKeys } from "@/components/admin/insurance-companies/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listInsuranceCompanies } from "@/lib/api/insurance-companies";
import type { InsuranceCompany } from "@/types/insurance-company";

export default function InsuranceCompaniesPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("insurance-companies");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formModal, setFormModal] = useState<
    { mode: "create" } | { mode: "edit"; insuranceCompanyId: number } | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<InsuranceCompany | null>(null);

  const insuranceCompaniesQuery = useQuery({
    queryKey: insuranceCompaniesKeys.all,
    queryFn: () => listInsuranceCompanies(),
    enabled: hasViewAccess,
  });

  if (!hasViewAccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card px-6 py-20 text-center shadow-xs">
        <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShieldOff className="size-5" aria-hidden="true" />
        </span>
        <p className="text-subtitle text-foreground">Access restricted</p>
        <p className="mt-1 max-w-sm text-body-sm text-muted-foreground">
          You don&apos;t have permission to view Insurance Companies.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Insurance Companies"
        description="Manage the nationwide insurance provider taxonomy hospitals can be mapped to."
        action={
          canCreate("insurance-companies") && (
            <Button onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add Insurance Company
            </Button>
          )
        }
      />

      <InsuranceCompaniesTable
        insuranceCompanies={insuranceCompaniesQuery.data?.insuranceCompanies ?? []}
        loading={insuranceCompaniesQuery.isLoading}
        error={
          insuranceCompaniesQuery.isError
            ? insuranceCompaniesQuery.error instanceof ApiError
              ? insuranceCompaniesQuery.error.message
              : "Unable to load insurance companies. Please try again."
            : null
        }
        onRetry={() => insuranceCompaniesQuery.refetch()}
        canUpdate={canUpdate("insurance-companies")}
        canDelete={canDelete("insurance-companies")}
        canCreate={canCreate("insurance-companies")}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onCreate={() => setFormModal({ mode: "create" })}
        onEdit={(item) => setFormModal({ mode: "edit", insuranceCompanyId: item.id })}
        onDelete={(item) => setDeleteTarget(item)}
      />

      <InsuranceCompanyFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        insuranceCompanyId={formModal?.mode === "edit" ? formModal.insuranceCompanyId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <DeleteInsuranceCompanyDialog insuranceCompany={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
