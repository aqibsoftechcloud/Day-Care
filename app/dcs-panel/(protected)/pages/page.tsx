"use client";

import { useState } from "react";
import { Plus, ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { PagesTable } from "@/components/admin/pages/PagesTable";
import { PageFormDialog } from "@/components/admin/pages/PageFormDialog";
import { PageViewDialog } from "@/components/admin/pages/PageViewDialog";
import { DeletePageDialog } from "@/components/admin/pages/DeletePageDialog";
import { pagesKeys } from "@/components/admin/pages/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listPages } from "@/lib/api/pages";
import type { Page } from "@/types/page";

export default function PagesPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("pages");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formModal, setFormModal] = useState<
    { mode: "create" } | { mode: "edit"; pageId: number } | null
  >(null);
  const [viewTarget, setViewTarget] = useState<Page | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Page | null>(null);

  const pagesQuery = useQuery({
    queryKey: pagesKeys.all,
    queryFn: () => listPages(),
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
          You don&apos;t have permission to view Pages.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Pages"
        description="Manage the content pages published on the website."
        action={
          canCreate("pages") ? (
            <Button onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add Page
            </Button>
          ) : undefined
        }
      />

      <PagesTable
        pages={pagesQuery.data?.pages ?? []}
        loading={pagesQuery.isLoading}
        error={
          pagesQuery.isError
            ? pagesQuery.error instanceof ApiError
              ? pagesQuery.error.message
              : "Unable to load pages. Please try again."
            : null
        }
        onRetry={() => pagesQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={canUpdate("pages")}
        canDelete={canDelete("pages")}
        canCreate={canCreate("pages")}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onCreate={() => setFormModal({ mode: "create" })}
        onView={(page) => setViewTarget(page)}
        onEdit={(page) => setFormModal({ mode: "edit", pageId: page.id })}
        onDelete={(page) => setDeleteTarget(page)}
      />

      <PageFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        pageId={formModal?.mode === "edit" ? formModal.pageId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <PageViewDialog page={viewTarget} onClose={() => setViewTarget(null)} />

      <DeletePageDialog page={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
