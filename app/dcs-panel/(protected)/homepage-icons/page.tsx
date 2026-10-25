"use client";

import { ShieldOff } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { HomepageIconsManager } from "@/components/admin/homepage-icons/HomepageIconsManager";
import { usePermission } from "@/hooks/usePermission";

export default function HomepageIconsPage() {
  const { canView, canUpdate } = usePermission();
  const hasViewAccess = canView("homepage-icons");

  if (!hasViewAccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card px-6 py-20 text-center shadow-xs">
        <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShieldOff className="size-5" aria-hidden="true" />
        </span>
        <p className="text-subtitle text-foreground">Access restricted</p>
        <p className="mt-1 max-w-sm text-body-sm text-muted-foreground">
          You don&apos;t have permission to view Homepage Icons.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Homepage Icons"
        description="Configure the icons shown in Hero Statistics, Why Choose Us, and Our Locations — globally, or per city."
      />

      <HomepageIconsManager canUpdate={canUpdate("homepage-icons")} />
    </div>
  );
}
