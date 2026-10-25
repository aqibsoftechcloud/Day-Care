"use client";

import { useState } from "react";
import { Plus, ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { LanguagesTable } from "@/components/admin/languages/LanguagesTable";
import { LanguageFormDialog } from "@/components/admin/languages/LanguageFormDialog";
import { LanguageViewDialog } from "@/components/admin/languages/LanguageViewDialog";
import { DeleteLanguageDialog } from "@/components/admin/languages/DeleteLanguageDialog";
import { languagesKeys } from "@/components/admin/languages/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listLanguages } from "@/lib/api/languages";
import type { Language } from "@/types/language";

export default function LanguagesPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("languages");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formModal, setFormModal] = useState<
    { mode: "create" } | { mode: "edit"; languageId: number } | null
  >(null);
  const [viewTarget, setViewTarget] = useState<Language | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Language | null>(null);

  const languagesQuery = useQuery({
    queryKey: languagesKeys.all,
    queryFn: listLanguages,
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
          You don&apos;t have permission to view Languages.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Languages"
        description="Manage languages used across the CMS."
        action={
          canCreate("languages") ? (
            <Button onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add Language
            </Button>
          ) : undefined
        }
      />

      <LanguagesTable
        languages={languagesQuery.data?.languages ?? []}
        loading={languagesQuery.isLoading}
        error={
          languagesQuery.isError
            ? languagesQuery.error instanceof ApiError
              ? languagesQuery.error.message
              : "Unable to load languages. Please try again."
            : null
        }
        onRetry={() => languagesQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={canUpdate("languages")}
        canDelete={canDelete("languages")}
        canCreate={canCreate("languages")}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onCreate={() => setFormModal({ mode: "create" })}
        onView={(language) => setViewTarget(language)}
        onEdit={(language) => setFormModal({ mode: "edit", languageId: language.id })}
        onDelete={(language) => setDeleteTarget(language)}
      />

      <LanguageFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        languageId={formModal?.mode === "edit" ? formModal.languageId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <LanguageViewDialog language={viewTarget} onClose={() => setViewTarget(null)} />

      <DeleteLanguageDialog language={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
