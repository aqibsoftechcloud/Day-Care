"use client";

import { useState } from "react";
import { Plus, ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { LocationsTable } from "@/components/admin/locations/LocationsTable";
import { LocationFormDialog } from "@/components/admin/locations/LocationFormDialog";
import { LocationViewDialog } from "@/components/admin/locations/LocationViewDialog";
import { DeleteLocationDialog } from "@/components/admin/locations/DeleteLocationDialog";
import { locationsKeys } from "@/components/admin/locations/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listLocations } from "@/lib/api/locations";
import type { Location } from "@/types/location";

export default function LocationsPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("locations");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");

  const [formModal, setFormModal] = useState<
    { mode: "create" } | { mode: "edit"; locationId: number } | null
  >(null);
  const [viewTarget, setViewTarget] = useState<Location | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null);

  const locationsQuery = useQuery({
    queryKey: locationsKeys.all,
    queryFn: listLocations,
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
          You don&apos;t have permission to view Locations.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Locations"
        description="Manage locations and their associated cities."
        action={
          canCreate("locations") ? (
            <Button onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add Location
            </Button>
          ) : undefined
        }
      />

      <LocationsTable
        locations={locationsQuery.data?.locations ?? []}
        loading={locationsQuery.isLoading}
        error={
          locationsQuery.isError
            ? locationsQuery.error instanceof ApiError
              ? locationsQuery.error.message
              : "Unable to load locations. Please try again."
            : null
        }
        onRetry={() => locationsQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={canUpdate("locations")}
        canDelete={canDelete("locations")}
        canCreate={canCreate("locations")}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        cityFilter={cityFilter}
        onCityFilterChange={setCityFilter}
        onCreate={() => setFormModal({ mode: "create" })}
        onView={(location) => setViewTarget(location)}
        onEdit={(location) => setFormModal({ mode: "edit", locationId: location.id })}
        onDelete={(location) => setDeleteTarget(location)}
      />

      <LocationFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        locationId={formModal?.mode === "edit" ? formModal.locationId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <LocationViewDialog location={viewTarget} onClose={() => setViewTarget(null)} />

      <DeleteLocationDialog location={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
