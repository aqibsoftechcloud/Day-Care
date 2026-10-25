"use client";

import { useState } from "react";
import { Plus, ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { TestimonialsTable } from "@/components/admin/testimonials/TestimonialsTable";
import { TestimonialFormDialog } from "@/components/admin/testimonials/TestimonialFormDialog";
import { TestimonialViewDialog } from "@/components/admin/testimonials/TestimonialViewDialog";
import { DeleteTestimonialDialog } from "@/components/admin/testimonials/DeleteTestimonialDialog";
import { testimonialsKeys } from "@/components/admin/testimonials/queries";
import { citiesKeys } from "@/components/admin/cities/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listTestimonials } from "@/lib/api/testimonials";
import { listCities } from "@/lib/api/cities";
import type { Testimonial } from "@/types/testimonial";

export default function TestimonialsPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("testimonials");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");

  const [formModal, setFormModal] = useState<
    { mode: "create" } | { mode: "edit"; testimonialId: number } | null
  >(null);
  const [viewTarget, setViewTarget] = useState<Testimonial | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);

  const testimonialsQuery = useQuery({
    queryKey: testimonialsKeys.all,
    queryFn: () => listTestimonials(),
    enabled: hasViewAccess,
  });

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
          You don&apos;t have permission to view Testimonials.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Testimonials"
        description="Manage patient testimonials shown on the website."
        action={
          canCreate("testimonials") && (
            <Button onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add Testimonial
            </Button>
          )
        }
      />

      <TestimonialsTable
        testimonials={testimonialsQuery.data?.testimonials ?? []}
        loading={testimonialsQuery.isLoading}
        error={
          testimonialsQuery.isError
            ? testimonialsQuery.error instanceof ApiError
              ? testimonialsQuery.error.message
              : "Unable to load testimonials. Please try again."
            : null
        }
        onRetry={() => testimonialsQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={canUpdate("testimonials")}
        canDelete={canDelete("testimonials")}
        canCreate={canCreate("testimonials")}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        cityFilter={cityFilter}
        onCityFilterChange={setCityFilter}
        cities={citiesQuery.data?.cities ?? []}
        onCreate={() => setFormModal({ mode: "create" })}
        onView={(testimonial) => setViewTarget(testimonial)}
        onEdit={(testimonial) => setFormModal({ mode: "edit", testimonialId: testimonial.id })}
        onDelete={(testimonial) => setDeleteTarget(testimonial)}
      />

      <TestimonialFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        testimonialId={formModal?.mode === "edit" ? formModal.testimonialId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <TestimonialViewDialog testimonial={viewTarget} onClose={() => setViewTarget(null)} />

      <DeleteTestimonialDialog testimonial={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
