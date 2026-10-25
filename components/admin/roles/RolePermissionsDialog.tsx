"use client";

import { useMemo, useState } from "react";
import { KeyRound, Layers, Loader2, type LucideIcon } from "lucide-react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/admin/LoadingButton";
import { Checkbox } from "@/components/ui/checkbox";
import { ErrorState } from "@/components/ui/ErrorState";
import { SearchInput } from "@/components/admin/data-table/SearchInput";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";
import { getRolePermissions, syncRolePermissions } from "@/lib/api/roles";
import { listPermissionsCatalog } from "@/lib/api/permissions";
import { notify } from "@/lib/toast";
import { rolesKeys } from "@/components/admin/roles/queries";
import { isNavGroup, NAV_ITEMS } from "@/lib/navigation";
import type { PermissionCatalogEntry } from "@/types/permission";
import type { Role } from "@/types/role";

type RolePermissionsDialogProps = {
  role: Role | null;
  onClose: () => void;
  canEdit: boolean;
};

// Canonical column order — modules that only have a subset (e.g. just
// "view") simply omit the missing columns; nothing is invented per row.
const ACTION_ORDER = ["view", "create", "update", "delete"];

const OTHER_SECTION_LABEL = "Other";

type ModuleRow = {
  moduleId: number;
  moduleSlug: string;
  /** The label shown in the table — the nav item's label when this module maps to one, else the raw backend module name. */
  displayName: string;
  actions: {
    actionSlug: string;
    actionName: string;
    permissionId: number;
  }[];
};

type PermissionSection = {
  key: string;
  label: string;
  icon: LucideIcon;
  order: number;
  rows: ModuleRow[];
};

type NavPlacement = {
  parentLabel: string;
  parentIcon: LucideIcon;
  parentOrder: number;
  childLabel: string;
  childOrder: number;
};

/**
 * Maps a permission's module slug (the part before the "." in a nav item's
 * `permission` string, e.g. "cities" from "cities.view") to the sidebar
 * group/label it lives under — built once from the same `lib/navigation.ts`
 * config that renders the sidebar, so the permission hierarchy always
 * matches the real navigation instead of a second hand-maintained copy.
 */
function buildNavPlacementMap(): Map<string, NavPlacement> {
  const map = new Map<string, NavPlacement>();
  let parentOrder = 0;

  for (const entry of NAV_ITEMS) {
    if (!isNavGroup(entry)) continue;

    let childOrder = 0;
    for (const child of entry.children) {
      if (child.permission) {
        const moduleSlug = child.permission.split(".")[0];
        if (!map.has(moduleSlug)) {
          map.set(moduleSlug, {
            parentLabel: entry.label,
            parentIcon: entry.icon,
            parentOrder,
            childLabel: child.label,
            childOrder,
          });
        }
      }
      childOrder += 1;
    }
    parentOrder += 1;
  }

  return map;
}

const NAV_PLACEMENT = buildNavPlacementMap();

function buildSections(catalog: PermissionCatalogEntry[]): PermissionSection[] {
  const rowsByModule = new Map<
    number,
    { slug: string; name: string; actions: ModuleRow["actions"] }
  >();

  for (const entry of catalog) {
    let row = rowsByModule.get(entry.module_id);
    if (!row) {
      row = { slug: entry.module.slug, name: entry.module.name, actions: [] };
      rowsByModule.set(entry.module_id, row);
    }
    row.actions.push({
      actionSlug: entry.action.slug,
      actionName: entry.action.name,
      permissionId: entry.id,
    });
  }

  const sectionsByLabel = new Map<string, PermissionSection>();

  for (const [moduleId, row] of rowsByModule) {
    row.actions.sort((a, b) => {
      const ai = ACTION_ORDER.indexOf(a.actionSlug);
      const bi = ACTION_ORDER.indexOf(b.actionSlug);
      if (ai === -1 && bi === -1)
        return a.actionSlug.localeCompare(b.actionSlug);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

    const placement = NAV_PLACEMENT.get(row.slug);
    const sectionLabel = placement?.parentLabel ?? OTHER_SECTION_LABEL;
    const sectionOrder = placement?.parentOrder ?? Number.MAX_SAFE_INTEGER;
    const sectionIcon = placement?.parentIcon ?? Layers;

    let section = sectionsByLabel.get(sectionLabel);
    if (!section) {
      section = {
        key: sectionLabel,
        label: sectionLabel,
        icon: sectionIcon,
        order: sectionOrder,
        rows: [],
      };
      sectionsByLabel.set(sectionLabel, section);
    }

    section.rows.push({
      moduleId,
      moduleSlug: row.slug,
      displayName: placement?.childLabel ?? row.name,
      actions: row.actions,
    });
  }

  for (const section of sectionsByLabel.values()) {
    section.rows.sort((a, b) => {
      const aOrder =
        NAV_PLACEMENT.get(a.moduleSlug)?.childOrder ?? Number.MAX_SAFE_INTEGER;
      const bOrder =
        NAV_PLACEMENT.get(b.moduleSlug)?.childOrder ?? Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.displayName.localeCompare(b.displayName);
    });
  }

  return [...sectionsByLabel.values()].sort((a, b) => a.order - b.order);
}

export function RolePermissionsDialog({
  role,
  onClose,
  canEdit,
}: RolePermissionsDialogProps) {
  return (
    <Dialog open={!!role} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton
        expandable
        className="flex h-[92vh] max-h-[92vh] w-full max-w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:h-[85vh] sm:max-h-[85vh] sm:max-w-[min(80vw,1100px)]"
      >
        <DialogHeader className="shrink-0 gap-1 border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5 pr-16">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <KeyRound className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-[15px]">
                Manage Permissions
              </DialogTitle>
              <DialogDescription className="text-[13px]">
                Role:{" "}
                <span className="font-medium text-foreground">
                  {role ? role.name : ""}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Keyed by role so opening for a different role remounts with a
            fresh selection/search state instead of needing a reset effect. */}
        {role && (
          <RolePermissionsBody
            key={role.id}
            role={role}
            onClose={onClose}
            canEdit={canEdit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RolePermissionsBody({
  role,
  onClose,
  canEdit,
}: {
  role: Role;
  onClose: () => void;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [initialized, setInitialized] = useState(false);

  const [catalogQuery, assignedQuery] = useQueries({
    queries: [
      {
        queryKey: rolesKeys.permissionCatalog,
        queryFn: listPermissionsCatalog,
        staleTime: 5 * 60_000,
      },
      {
        queryKey: rolesKeys.permissions(role.id),
        queryFn: () => getRolePermissions(role.id),
      },
    ],
  });

  const loading = catalogQuery.isLoading || assignedQuery.isLoading;
  const error = catalogQuery.error ?? assignedQuery.error;

  // Seed selection from the fetched assignment once — done synchronously in
  // the render body via a guarded flag rather than an effect, so re-renders
  // while the user is actively toggling checkboxes never clobber their
  // in-progress changes.
  if (!initialized && assignedQuery.data) {
    setSelectedIds(
      new Set(assignedQuery.data.permissions.map((p) => p.permission_id)),
    );
    setInitialized(true);
  }

  const catalog = useMemo(
    () => catalogQuery.data?.permissions ?? [],
    [catalogQuery.data],
  );
  const allSections = useMemo(() => buildSections(catalog), [catalog]);

  const visibleSections = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allSections;
    return allSections
      .map((section) => ({
        ...section,
        rows: section.rows.filter((row) =>
          row.displayName.toLowerCase().includes(q),
        ),
      }))
      .filter((section) => section.rows.length > 0);
  }, [allSections, search]);

  const visiblePermissionIds = useMemo(
    () =>
      visibleSections.flatMap((section) =>
        section.rows.flatMap((row) => row.actions.map((a) => a.permissionId)),
      ),
    [visibleSections],
  );

  const togglePermission = (permissionId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedIds((prev) => new Set([...prev, ...visiblePermissionIds]));
  };

  const clearAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of visiblePermissionIds) next.delete(id);
      return next;
    });
  };

  const mutation = useMutation({
    mutationFn: () => syncRolePermissions(role.id, [...selectedIds]),
    onSuccess: () => {
      notify.success("Permissions updated successfully.");
      queryClient.invalidateQueries({
        queryKey: rolesKeys.permissions(role.id),
      });
      onClose();
    },
    onError: (err) => {
      notify.apiError(err, "Failed to save permissions.");
    },
  });

  return (
    <>
      {loading ? (
        <div className="flex flex-1 items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Loading permissions…
        </div>
      ) : error ? (
        <div className="flex-1 overflow-y-auto">
          <ErrorState
            message={
              error instanceof ApiError
                ? error.message
                : "Failed to load permissions."
            }
          />
        </div>
      ) : (
        <>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-background px-5 py-3.5">
            <div className="flex items-center gap-2 text-body-sm">
              <span className="font-semibold text-foreground">
                {catalog.length}
              </span>
              <span className="text-muted-foreground">permissions</span>
              <span className="text-border">·</span>
              <span className="font-semibold text-primary">
                {selectedIds.size}
              </span>
              <span className="text-muted-foreground">selected</span>
            </div>
            {canEdit && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllVisible}
                  className="text-muted-foreground"
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllVisible}
                  className="text-muted-foreground"
                >
                  Clear All
                </Button>
              </div>
            )}
          </div>

          <div className="shrink-0 border-b border-border px-5 py-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search permissions…"
              className="max-w-full"
            />
          </div>

          <div className="flex-1 overflow-hidden px-5 py-3">
            {/* h-full gives the inner scroller below a definite height to
                size against (max-h-full is a no-op without it) — this div
                itself no longer scrolls, it's just the static bordered
                frame; the table wrapper below is the one true scroller. */}
            <div className="h-full rounded-lg border border-border">
              {/* Single element handling BOTH axes, not two nested
                  single-axis wrappers (that was the original approach, but
                  a lone `overflow-x-auto` here — with the real vertical
                  scroller one level up — silently upgrades this wrapper's
                  computed overflow-y to `auto` too, per the CSS "one axis
                  non-visible forces the other to auto" rule, and that
                  happens even if overflow-y is explicitly set to `visible`.
                  That makes THIS zero-extra-height box the sticky-position
                  containing block instead of a real scroller, so
                  `sticky top-0` below silently does nothing. Scrolling both
                  axes here — capped at the parent's full height, shrinking
                  to fit when content is short — makes this the one genuine
                  scroll container, so the sticky header actually sticks. */}
              <div className="max-h-full overflow-auto">
                <table className="w-full min-w-120 text-left">
                  <thead>
                    {/* Every header cell shares one opaque `bg-muted` — previously
                        Module used the opaque tone while the four permission
                        columns used a translucent `/50`, which both read as an
                        inconsistent header and let scrolling rows bleed through
                        the sticky header via the translucent cells. */}
                    <tr className="border-b border-border bg-muted text-table-header">
                      <th className="sticky top-0 z-10 bg-muted px-4 py-2.5 text-left">
                        Module
                      </th>
                      <th className="sticky top-0 z-10 w-16 bg-muted px-2 py-2.5 text-center">
                        View
                      </th>
                      <th className="sticky top-0 z-10 w-16 bg-muted px-2 py-2.5 text-center">
                        Create
                      </th>
                      <th className="sticky top-0 z-10 w-16 bg-muted px-2 py-2.5 text-center">
                        Update
                      </th>
                      <th className="sticky top-0 z-10 w-16 bg-muted px-2 py-2.5 text-center">
                        Delete
                      </th>
                    </tr>
                  </thead>
                  {visibleSections.map((section) => {
                    const SectionIcon = section.icon;
                    return (
                      <tbody
                        key={section.key}
                        className="divide-y divide-border/70"
                      >
                        <tr className="border-b border-border bg-muted/60">
                          <th
                            colSpan={5}
                            scope="colgroup"
                            className="px-4 py-2 text-left"
                          >
                            <span className="flex items-center gap-2 text-label font-semibold text-foreground">
                              <SectionIcon
                                className="size-3.5 text-muted-foreground"
                                aria-hidden="true"
                              />
                              {section.label}
                            </span>
                          </th>
                        </tr>
                        {section.rows.map((row, rowIndex) => {
                          const byAction = new Map(
                            row.actions.map((a) => [a.actionSlug, a]),
                          );
                          const selectedCount = row.actions.filter((a) =>
                            selectedIds.has(a.permissionId),
                          ).length;
                          return (
                            <tr
                              key={row.moduleId}
                              className={cn(
                                "transition-colors hover:bg-muted/40",
                                // Rows with any permission checked keep their existing tint;
                                // zebra striping only kicks in otherwise, so the two never
                                // compete for the same row (no CSS-priority ambiguity).
                                selectedCount > 0
                                  ? "bg-primary/3"
                                  : rowIndex % 2 === 1 && "bg-muted/30",
                              )}
                            >
                              <td className="px-4 py-2.5 pl-8 text-table-body text-foreground">
                                {row.displayName}
                              </td>
                              {ACTION_ORDER.map((actionSlug) => {
                                const action = byAction.get(actionSlug);
                                return (
                                  <td
                                    key={actionSlug}
                                    className="px-2 py-2.5 text-center"
                                  >
                                    {action ? (
                                      // Checkbox renders as `flex` (a block-level box), so the
                                      // td's `text-center` — which only centers inline content —
                                      // can't center it; this wrapper does the centering instead.
                                      <div className="flex items-center justify-center">
                                        <Checkbox
                                          checked={selectedIds.has(
                                            action.permissionId,
                                          )}
                                          onCheckedChange={() =>
                                            togglePermission(
                                              action.permissionId,
                                            )
                                          }
                                          disabled={!canEdit}
                                          aria-label={`${row.displayName} — ${action.actionName}`}
                                        />
                                      </div>
                                    ) : (
                                      <span
                                        className="text-muted-foreground/30"
                                        aria-hidden="true"
                                      >
                                        —
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    );
                  })}
                </table>
              </div>
              {visibleSections.length === 0 && (
                <p className="px-4 py-10 text-center text-body-sm text-muted-foreground">
                  No permissions match &quot;{search}&quot;.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      <DialogFooter className="mx-0 mb-0 shrink-0 rounded-b-xl border-t border-border bg-muted/50 px-5 py-4">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
        {canEdit && (
          <LoadingButton
            onClick={() => mutation.mutate()}
            disabled={loading || !!error}
            loading={mutation.isPending}
            loadingText="Saving…"
          >
            Save Permissions
          </LoadingButton>
        )}
      </DialogFooter>
    </>
  );
}
