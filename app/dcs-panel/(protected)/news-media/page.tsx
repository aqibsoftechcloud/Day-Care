"use client";

import { useState } from "react";
import { Plus, ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { NewsMediaTable } from "@/components/admin/news-media/NewsMediaTable";
import { NewsMediaFormDialog } from "@/components/admin/news-media/NewsMediaFormDialog";
import { NewsMediaViewDialog } from "@/components/admin/news-media/NewsMediaViewDialog";
import { DeleteNewsMediaDialog } from "@/components/admin/news-media/DeleteNewsMediaDialog";
import { newsMediaKeys } from "@/components/admin/news-media/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listNewsMedia } from "@/lib/api/news-media";
import type { NewsMedia } from "@/types/news-media";

export default function NewsMediaPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("news-and-media");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formModal, setFormModal] = useState<
    { mode: "create" } | { mode: "edit"; newsMediaId: number } | null
  >(null);
  const [viewTarget, setViewTarget] = useState<NewsMedia | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NewsMedia | null>(null);

  const newsMediaQuery = useQuery({
    queryKey: newsMediaKeys.all,
    queryFn: () => listNewsMedia(),
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
          You don&apos;t have permission to view News & Media.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="News & Media"
        description="Manage news coverage and media mentions shown on the website."
        action={
          canCreate("news-and-media") && (
            <Button onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add News & Media
            </Button>
          )
        }
      />

      <NewsMediaTable
        newsMedia={newsMediaQuery.data?.newsMedia ?? []}
        loading={newsMediaQuery.isLoading}
        error={
          newsMediaQuery.isError
            ? newsMediaQuery.error instanceof ApiError
              ? newsMediaQuery.error.message
              : "Unable to load news & media items. Please try again."
            : null
        }
        onRetry={() => newsMediaQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={canUpdate("news-and-media")}
        canDelete={canDelete("news-and-media")}
        canCreate={canCreate("news-and-media")}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onCreate={() => setFormModal({ mode: "create" })}
        onView={(item) => setViewTarget(item)}
        onEdit={(item) => setFormModal({ mode: "edit", newsMediaId: item.id })}
        onDelete={(item) => setDeleteTarget(item)}
      />

      <NewsMediaFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        newsMediaId={formModal?.mode === "edit" ? formModal.newsMediaId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <NewsMediaViewDialog newsMediaItem={viewTarget} onClose={() => setViewTarget(null)} />

      <DeleteNewsMediaDialog newsMediaItem={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
