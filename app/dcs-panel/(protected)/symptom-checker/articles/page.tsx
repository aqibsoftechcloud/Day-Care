"use client";

import { useState } from "react";
import { Plus, ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { SymptomArticlesTable } from "@/components/admin/symptom-articles/SymptomArticlesTable";
import { SymptomArticleFormDialog } from "@/components/admin/symptom-articles/SymptomArticleFormDialog";
import { SymptomArticleViewDialog } from "@/components/admin/symptom-articles/SymptomArticleViewDialog";
import { DeleteSymptomArticleDialog } from "@/components/admin/symptom-articles/DeleteSymptomArticleDialog";
import { symptomArticlesKeys } from "@/components/admin/symptom-articles/queries";
import { symptomPartsKeys } from "@/components/admin/symptom-parts/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listSymptomArticles } from "@/lib/api/symptom-articles";
import { listSymptomParts } from "@/lib/api/symptom-parts";
import type { SymptomArticle } from "@/types/symptom-article";

export default function SymptomArticlesPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("articles");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [partFilter, setPartFilter] = useState("all");

  const [formModal, setFormModal] = useState<{ mode: "create" } | { mode: "edit"; articleId: number } | null>(null);
  const [viewTarget, setViewTarget] = useState<SymptomArticle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SymptomArticle | null>(null);

  const articlesQuery = useQuery({
    queryKey: symptomArticlesKeys.all,
    queryFn: () => listSymptomArticles(),
    enabled: hasViewAccess,
  });

  const partsQuery = useQuery({
    queryKey: symptomPartsKeys.all,
    queryFn: () => listSymptomParts(),
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
          You don&apos;t have permission to view Articles.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Articles"
        description="Manage articles mapped to body parts and symptoms."
        action={
          canCreate("articles") && (
            <Button onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add Article
            </Button>
          )
        }
      />

      <SymptomArticlesTable
        symptomArticles={articlesQuery.data?.symptomArticles ?? []}
        symptomParts={partsQuery.data?.symptomParts ?? []}
        loading={articlesQuery.isLoading}
        error={
          articlesQuery.isError
            ? articlesQuery.error instanceof ApiError
              ? articlesQuery.error.message
              : "Unable to load articles. Please try again."
            : null
        }
        onRetry={() => articlesQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={canUpdate("articles")}
        canDelete={canDelete("articles")}
        canCreate={canCreate("articles")}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        partFilter={partFilter}
        onPartFilterChange={setPartFilter}
        onCreate={() => setFormModal({ mode: "create" })}
        onView={(article) => setViewTarget(article)}
        onEdit={(article) => setFormModal({ mode: "edit", articleId: article.id })}
        onDelete={(article) => setDeleteTarget(article)}
      />

      <SymptomArticleFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        articleId={formModal?.mode === "edit" ? formModal.articleId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <SymptomArticleViewDialog article={viewTarget} onClose={() => setViewTarget(null)} />

      <DeleteSymptomArticleDialog article={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
