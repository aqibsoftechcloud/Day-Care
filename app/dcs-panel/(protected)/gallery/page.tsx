"use client";

import { useState } from "react";
import { Plus, ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { GalleryTable } from "@/components/admin/gallery/GalleryTable";
import { GalleryFormDialog } from "@/components/admin/gallery/GalleryFormDialog";
import { GalleryViewDialog } from "@/components/admin/gallery/GalleryViewDialog";
import { DeleteGalleryDialog } from "@/components/admin/gallery/DeleteGalleryDialog";
import { galleryKeys } from "@/components/admin/gallery/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listGallery } from "@/lib/api/gallery";
import type { Gallery } from "@/types/gallery";

export default function GalleryPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("gallery");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [formModal, setFormModal] = useState<{ mode: "create" } | { mode: "edit"; galleryId: number } | null>(null);
  const [viewTarget, setViewTarget] = useState<Gallery | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Gallery | null>(null);

  const galleryQuery = useQuery({
    queryKey: galleryKeys.all,
    queryFn: () => listGallery(),
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
          You don&apos;t have permission to view Gallery.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Gallery"
        description="Manage the image and video gallery shown on the website."
        action={
          canCreate("gallery") && (
            <Button onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add Gallery Item
            </Button>
          )
        }
      />

      <GalleryTable
        gallery={galleryQuery.data?.gallery ?? []}
        loading={galleryQuery.isLoading}
        error={
          galleryQuery.isError
            ? galleryQuery.error instanceof ApiError
              ? galleryQuery.error.message
              : "Unable to load gallery items. Please try again."
            : null
        }
        onRetry={() => galleryQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={canUpdate("gallery")}
        canDelete={canDelete("gallery")}
        canCreate={canCreate("gallery")}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        onCreate={() => setFormModal({ mode: "create" })}
        onView={(item) => setViewTarget(item)}
        onEdit={(item) => setFormModal({ mode: "edit", galleryId: item.id })}
        onDelete={(item) => setDeleteTarget(item)}
      />

      <GalleryFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        galleryId={formModal?.mode === "edit" ? formModal.galleryId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <GalleryViewDialog galleryItem={viewTarget} onClose={() => setViewTarget(null)} />

      <DeleteGalleryDialog galleryItem={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
