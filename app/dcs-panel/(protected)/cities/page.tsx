"use client";

import { useState } from "react";
import { Plus, ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { CitiesTable } from "@/components/admin/cities/CitiesTable";
import { CityFormDialog } from "@/components/admin/cities/CityFormDialog";
import { CityViewDialog } from "@/components/admin/cities/CityViewDialog";
import { DeleteCityDialog } from "@/components/admin/cities/DeleteCityDialog";
import { citiesKeys } from "@/components/admin/cities/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listCities } from "@/lib/api/cities";
import type { City } from "@/types/city";

export default function CitiesPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("cities");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formModal, setFormModal] = useState<
    { mode: "create" } | { mode: "edit"; cityId: number } | null
  >(null);
  const [viewTarget, setViewTarget] = useState<City | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<City | null>(null);

  const citiesQuery = useQuery({
    queryKey: citiesKeys.all,
    queryFn: listCities,
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
          You don&apos;t have permission to view Cities.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Cities"
        description="Manage cities and their language associations."
        action={
          canCreate("cities") ? (
            <Button onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add City
            </Button>
          ) : undefined
        }
      />

      <CitiesTable
        cities={citiesQuery.data?.cities ?? []}
        loading={citiesQuery.isLoading}
        error={
          citiesQuery.isError
            ? citiesQuery.error instanceof ApiError
              ? citiesQuery.error.message
              : "Unable to load cities. Please try again."
            : null
        }
        onRetry={() => citiesQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={canUpdate("cities")}
        canDelete={canDelete("cities")}
        canCreate={canCreate("cities")}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onCreate={() => setFormModal({ mode: "create" })}
        onView={(city) => setViewTarget(city)}
        onEdit={(city) => setFormModal({ mode: "edit", cityId: city.id })}
        onDelete={(city) => setDeleteTarget(city)}
      />

      <CityFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        cityId={formModal?.mode === "edit" ? formModal.cityId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <CityViewDialog city={viewTarget} onClose={() => setViewTarget(null)} />

      <DeleteCityDialog city={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
