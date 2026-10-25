"use client";

import { DetailSheet } from "@/components/admin/DetailSheet";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format-date";
import { toSafeEditorHtml } from "@/lib/sanitize-html";
import type { HealthPackage } from "@/types/health-package";

type HealthPackageViewDialogProps = {
  healthPackage: HealthPackage | null;
  onClose: () => void;
};

export function HealthPackageViewDialog({ healthPackage, onClose }: HealthPackageViewDialogProps) {
  if (!healthPackage) return null;

  return (
    <DetailSheet
      open={!!healthPackage}
      onClose={onClose}
      title="Package Details"
      description={healthPackage.package_title}
      sections={[
        {
          heading: "Package Information",
          rows: [
            { label: "Package Title", value: healthPackage.package_title },
            { label: "Cost", value: healthPackage.cost },
            { label: "Status", value: <StatusBadge status={healthPackage.status} /> },
          ],
        },
        {
          heading: "Content",
          rows: [
            {
              label: "Pack Image",
              value: healthPackage.pack_image ? (
                // eslint-disable-next-line @next/next/no-img-element -- small preview of the stored uploaded image.
                <img src={healthPackage.pack_image} alt="" className="max-h-16 rounded-md border border-border object-contain" />
              ) : (
                "—"
              ),
            },
            { label: "Package File", value: healthPackage.package_file || "—" },
            {
              label: "Package Inclusions",
              value: healthPackage.package_inclusions ? (
                <div className="rte-content" dangerouslySetInnerHTML={{ __html: toSafeEditorHtml(healthPackage.package_inclusions) }} />
              ) : (
                "—"
              ),
            },
          ],
        },
        {
          heading: "SEO",
          rows: [
            { label: "SEO URL", value: healthPackage.seo_url },
            { label: "Meta Title", value: healthPackage.meta_title || "—" },
            { label: "Meta Description", value: healthPackage.meta_description || "—" },
            { label: "Meta Keywords", value: healthPackage.meta_keywords || "—" },
          ],
        },
        {
          heading: "Timestamps",
          rows: [
            { label: "Created", value: formatDate(healthPackage.created_at) },
            { label: "Updated", value: formatDate(healthPackage.updated_at) },
          ],
        },
      ]}
    />
  );
}
