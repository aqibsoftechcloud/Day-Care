"use client";

import { DetailSheet } from "@/components/admin/DetailSheet";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format-date";
import type { Menu } from "@/types/menu";

type MenuViewDialogProps = {
  menu: Menu | null;
  onClose: () => void;
};

const TARGET_TYPE_LABELS: Record<Menu["target_type"], string> = {
  none: "No Link / Group",
  speciality: "Speciality",
  treatment: "Treatment",
  hospital: "Hospital",
  doctor: "Doctor",
  doctor_speciality: "Doctor Speciality",
  blog: "Blog",
  blog_category: "Blog Category",
  page: "Page",
  listing: "Listing / System Page",
  global_speciality: "Global Speciality",
};

const PLACEMENT_LABELS: Record<Menu["placement"], string> = {
  primary: "Primary navigation (top header row)",
  secondary: "Secondary navigation (category row)",
  footer: "Footer",
};

export function MenuViewDialog({ menu, onClose }: MenuViewDialogProps) {
  if (!menu) return null;

  return (
    <DetailSheet
      open={!!menu}
      onClose={onClose}
      title="Menu Details"
      description={menu.title}
      sections={[
        {
          heading: "Menu Information",
          rows: [
            { label: "Title", value: menu.title },
            { label: "Parent Menu", value: menu.parent ? menu.parent.title : "None (top-level)" },
            {
              label: "Placement",
              value: menu.parent ? "Inherited from parent" : PLACEMENT_LABELS[menu.placement],
            },
            { label: "Language", value: menu.language.name },
            { label: "City", value: menu.city ? menu.city.city_name : "Global (All Cities)" },
            { label: "Sorting Order", value: String(menu.sorting_order) },
            { label: "Status", value: <StatusBadge status={menu.status} /> },
          ],
        },
        {
          heading: "Link",
          rows: [
            { label: "Link Type", value: TARGET_TYPE_LABELS[menu.target_type] },
            ...(menu.target_type !== "none"
              ? [
                  {
                    label: "Target",
                    value: menu.target
                      ? `${menu.target.label}${menu.target.status !== "active" ? " (inactive)" : ""}`
                      : "This target no longer exists",
                  },
                ]
              : []),
          ],
        },
        {
          heading: "SEO",
          rows: [{ label: "SEO URL", value: menu.seo_url }],
        },
        {
          heading: "Timestamps",
          rows: [
            { label: "Created", value: formatDate(menu.created_at) },
            { label: "Updated", value: formatDate(menu.updated_at) },
          ],
        },
      ]}
    />
  );
}
