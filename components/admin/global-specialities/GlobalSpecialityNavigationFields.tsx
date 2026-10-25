"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import type { Menu, MenuPlacement } from "@/types/menu";

export const NAV_TOP_LEVEL_VALUE = "__top_level__";
export const NAV_NEW_PARENT_VALUE = "__new_parent__";

const PLACEMENT_OPTIONS: { value: MenuPlacement; label: string }[] = [
  { value: "primary", label: "Primary navigation (top header row)" },
  { value: "secondary", label: "Secondary navigation (category row)" },
  { value: "footer", label: "Footer" },
];

export type GlobalSpecialityNavigationFieldsValue = {
  showInNav: boolean;
  label: string;
  /** NAV_TOP_LEVEL_VALUE | NAV_NEW_PARENT_VALUE | a real parent menu id (as a string). */
  parentSelection: string;
  newParentTitle: string;
  placement: MenuPlacement;
  sortingOrder: string;
};

type GlobalSpecialityNavigationFieldsProps = {
  value: GlobalSpecialityNavigationFieldsValue;
  onChange: (patch: Partial<GlobalSpecialityNavigationFieldsValue>) => void;
  disabled: boolean;
  /** `/dcg/{seoUrl}` — always derived from the form's own current seo_url field, never entered here. */
  destinationUrl: string;
  /** Shown as the Menu label input's placeholder when the admin hasn't typed one — the speciality's own current title/name. */
  fallbackLabel: string;
  /** Existing GLOBAL top-level menus — same data source as the Menu Management Parent Menu dropdown, already filtered to exclude this speciality's own current navigation row (if editing). */
  parentOptions: Menu[];
  parentOptionsLoading: boolean;
  /** The full global menu set, only used to preview an existing parent's current children. */
  allGlobalMenus: Menu[];
  canView: boolean;
  canEdit: boolean;
};

/**
 * Pure, fully-controlled fields for the Basic Information tab's
 * navigation section — no data fetching, no mutation, no Save button of
 * its own. All data (parent menu options, permissions) and all writes
 * are owned by GlobalSpecialityFormDialog.tsx, which bundles this
 * configuration into the same create/update submit as FAQs already are.
 */
export function GlobalSpecialityNavigationFields({
  value,
  onChange,
  disabled,
  destinationUrl,
  fallbackLabel,
  parentOptions,
  parentOptionsLoading,
  allGlobalMenus,
  canView,
  canEdit,
}: GlobalSpecialityNavigationFieldsProps) {
  const { showInNav, label, parentSelection, newParentTitle, placement, sortingOrder } = value;

  const selectedExistingParent = useMemo(
    () =>
      parentSelection !== NAV_TOP_LEVEL_VALUE && parentSelection !== NAV_NEW_PARENT_VALUE
        ? parentOptions.find((menu) => String(menu.id) === parentSelection)
        : undefined,
    [parentOptions, parentSelection]
  );

  const siblingPreview = useMemo(
    () => (selectedExistingParent ? allGlobalMenus.filter((menu) => menu.parent_id === selectedExistingParent.id) : []),
    [allGlobalMenus, selectedExistingParent]
  );

  if (!canView) {
    return (
      <p className="text-helper">You don&apos;t have permission to view navigation configuration.</p>
    );
  }

  const fieldsDisabled = disabled || !canEdit;

  return (
    <div className="flex flex-col gap-5">
      <Field orientation="horizontal" className="justify-between rounded-md border border-border px-3 py-2.5">
        <div className="flex flex-col gap-0.5">
          <FieldLabel htmlFor="global-speciality-show-in-nav">Show in global navigation</FieldLabel>
          <p className="text-helper">Include this global speciality in the public website&apos;s navigation.</p>
        </div>
        <Switch
          id="global-speciality-show-in-nav"
          checked={showInNav}
          onCheckedChange={(checked) => onChange({ showInNav: checked })}
          disabled={fieldsDisabled}
        />
      </Field>

      {!canEdit && (
        <p className="text-helper">You have view-only access to navigation configuration.</p>
      )}

      {showInNav && (
        <>
          <Field>
            <FieldLabel htmlFor="global-speciality-nav-label">Menu label</FieldLabel>
            <Input
              id="global-speciality-nav-label"
              value={label}
              placeholder={fallbackLabel}
              onChange={(e) => onChange({ label: e.target.value })}
              disabled={fieldsDisabled}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="global-speciality-nav-parent">Parent menu</FieldLabel>
            <Select
              value={parentSelection}
              onValueChange={(next) => onChange({ parentSelection: next })}
              disabled={fieldsDisabled || parentOptionsLoading}
            >
              <SelectTrigger id="global-speciality-nav-parent" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NAV_TOP_LEVEL_VALUE}>None — add as a top-level item</SelectItem>
                <SelectItem value={NAV_NEW_PARENT_VALUE}>+ Create a new parent menu</SelectItem>
                {parentOptions.map((menu) => (
                  <SelectItem key={menu.id} value={String(menu.id)}>
                    {menu.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {parentSelection === NAV_NEW_PARENT_VALUE && (
            <Field>
              <FieldLabel htmlFor="global-speciality-new-parent-title">New parent menu title</FieldLabel>
              <Input
                id="global-speciality-new-parent-title"
                value={newParentTitle}
                onChange={(e) => onChange({ newParentTitle: e.target.value })}
                placeholder="e.g. Explore Specialities"
                disabled={fieldsDisabled}
              />
            </Field>
          )}

          {(parentSelection === NAV_TOP_LEVEL_VALUE || parentSelection === NAV_NEW_PARENT_VALUE) && (
            <Field>
              <FieldLabel htmlFor="global-speciality-nav-placement">Placement</FieldLabel>
              <Select
                value={placement}
                onValueChange={(next) => onChange({ placement: next as MenuPlacement })}
                disabled={fieldsDisabled}
              >
                <SelectTrigger id="global-speciality-nav-placement" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLACEMENT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="global-speciality-nav-order">Display order</FieldLabel>
            <Input
              id="global-speciality-nav-order"
              type="number"
              step="1"
              value={sortingOrder}
              onChange={(e) => onChange({ sortingOrder: e.target.value })}
              disabled={fieldsDisabled}
            />
          </Field>

          <Field>
            <FieldLabel>Page destination</FieldLabel>
            <p className="rounded-md border border-border bg-muted/30 px-3 py-2 font-mono text-body-sm text-muted-foreground">
              {destinationUrl}
            </p>
            <p className="text-helper">Always derived from this global speciality&apos;s own SEO URL — never entered manually.</p>
          </Field>

          <Field>
            <FieldLabel>Navigation preview</FieldLabel>
            <div className="rounded-md border border-border px-3 py-2.5 text-body-sm">
              {parentSelection === NAV_TOP_LEVEL_VALUE && (
                <p>
                  <span className="font-semibold text-foreground">{label || fallbackLabel}</span> will appear as a new
                  top-level item in {PLACEMENT_OPTIONS.find((p) => p.value === placement)?.label}.
                </p>
              )}
              {parentSelection === NAV_NEW_PARENT_VALUE && (
                <p>
                  A new parent menu <span className="font-semibold text-foreground">{newParentTitle || "(untitled)"}</span> will
                  be created in {PLACEMENT_OPTIONS.find((p) => p.value === placement)?.label}, with{" "}
                  <span className="font-semibold text-foreground">{label || fallbackLabel}</span> as its first child.
                </p>
              )}
              {selectedExistingParent && (
                <div className="flex flex-col gap-1">
                  <p>
                    <span className="font-semibold text-foreground">{selectedExistingParent.title}</span> currently has{" "}
                    {siblingPreview.length} child item{siblingPreview.length === 1 ? "" : "s"}:
                  </p>
                  <ul className="list-inside list-disc text-muted-foreground">
                    {siblingPreview.map((child) => (
                      <li key={child.id}>{child.title}</li>
                    ))}
                    <li className="text-foreground">
                      <span className="font-semibold">{label || fallbackLabel}</span> (new)
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </Field>
        </>
      )}
    </div>
  );
}
