"use client";

import { useState } from "react";
import { Plus, ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { GeneralFaqsTable } from "@/components/admin/general-faqs/GeneralFaqsTable";
import { GeneralFaqFormDialog } from "@/components/admin/general-faqs/GeneralFaqFormDialog";
import { GeneralFaqViewDialog } from "@/components/admin/general-faqs/GeneralFaqViewDialog";
import { DeleteGeneralFaqDialog } from "@/components/admin/general-faqs/DeleteGeneralFaqDialog";
import { generalFaqsKeys } from "@/components/admin/general-faqs/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listGeneralFaqs } from "@/lib/api/general-faqs";
import type { GeneralFaq } from "@/types/general-faq";

export default function GeneralFaqsPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("general-faqs");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formModal, setFormModal] = useState<
    { mode: "create" } | { mode: "edit"; faqId: number } | null
  >(null);
  const [viewTarget, setViewTarget] = useState<GeneralFaq | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GeneralFaq | null>(null);

  const faqsQuery = useQuery({
    queryKey: generalFaqsKeys.all,
    queryFn: () => listGeneralFaqs(),
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
          You don&apos;t have permission to view General FAQs.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="General FAQs"
        description="Manage frequently asked questions shown to website visitors."
        action={
          canCreate("general-faqs") ? (
            <Button onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add FAQ
            </Button>
          ) : undefined
        }
      />

      <GeneralFaqsTable
        faqs={faqsQuery.data?.generalFaqs ?? []}
        loading={faqsQuery.isLoading}
        error={
          faqsQuery.isError
            ? faqsQuery.error instanceof ApiError
              ? faqsQuery.error.message
              : "Unable to load FAQs. Please try again."
            : null
        }
        onRetry={() => faqsQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={canUpdate("general-faqs")}
        canDelete={canDelete("general-faqs")}
        canCreate={canCreate("general-faqs")}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onCreate={() => setFormModal({ mode: "create" })}
        onView={(faq) => setViewTarget(faq)}
        onEdit={(faq) => setFormModal({ mode: "edit", faqId: faq.id })}
        onDelete={(faq) => setDeleteTarget(faq)}
      />

      <GeneralFaqFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        faqId={formModal?.mode === "edit" ? formModal.faqId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <GeneralFaqViewDialog faq={viewTarget} onClose={() => setViewTarget(null)} />

      <DeleteGeneralFaqDialog faq={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
