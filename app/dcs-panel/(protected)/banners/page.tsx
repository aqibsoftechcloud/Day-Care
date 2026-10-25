"use client";

import { useState } from "react";
import { Plus, ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { BannersTable } from "@/components/admin/banners/BannersTable";
import { BannerFormDialog } from "@/components/admin/banners/BannerFormDialog";
import { BannerViewDialog } from "@/components/admin/banners/BannerViewDialog";
import { DeleteBannerDialog } from "@/components/admin/banners/DeleteBannerDialog";
import { bannersKeys } from "@/components/admin/banners/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listBanners } from "@/lib/api/banners";
import type { Banner } from "@/types/banner";

export default function BannersPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("banners");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formModal, setFormModal] = useState<
    { mode: "create" } | { mode: "edit"; bannerId: number } | null
  >(null);
  const [viewTarget, setViewTarget] = useState<Banner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);

  const bannersQuery = useQuery({
    queryKey: bannersKeys.all,
    queryFn: listBanners,
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
          You don&apos;t have permission to view Banners.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Banners"
        description="Manage the promotional banners displayed on the website."
        action={
          canCreate("banners") ? (
            <Button onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add Banner
            </Button>
          ) : undefined
        }
      />

      <BannersTable
        banners={bannersQuery.data?.banners ?? []}
        loading={bannersQuery.isLoading}
        error={
          bannersQuery.isError
            ? bannersQuery.error instanceof ApiError
              ? bannersQuery.error.message
              : "Unable to load banners. Please try again."
            : null
        }
        onRetry={() => bannersQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={canUpdate("banners")}
        canDelete={canDelete("banners")}
        canCreate={canCreate("banners")}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onCreate={() => setFormModal({ mode: "create" })}
        onView={(banner) => setViewTarget(banner)}
        onEdit={(banner) => setFormModal({ mode: "edit", bannerId: banner.id })}
        onDelete={(banner) => setDeleteTarget(banner)}
      />

      <BannerFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        bannerId={formModal?.mode === "edit" ? formModal.bannerId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <BannerViewDialog banner={viewTarget} onClose={() => setViewTarget(null)} />

      <DeleteBannerDialog banner={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
