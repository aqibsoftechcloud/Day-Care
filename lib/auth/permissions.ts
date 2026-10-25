/**
 * Frontend permission utilities. These are UX-only: they control what's
 * shown/enabled in the UI, nothing more. The backend's requirePermission()
 * guard (lib/auth/authorization.ts, server-side) remains the real
 * security boundary — every one of these checks has a matching backend
 * enforcement, and none of these should ever be treated as sufficient on
 * their own.
 *
 * Permission strings are exactly "<module-slug>.<action-slug>" (e.g.
 * "doctors.view"), taken verbatim from the actual backend module/action
 * slugs — never invented here.
 */

export function hasPermission(
  permissions: string[],
  permission: string
): boolean {
  return permissions.includes(permission);
}

/** True if the user holds ANY permission for the given module slug — used to decide whether a sidebar parent group should render at all. */
export function hasAnyModulePermission(
  permissions: string[],
  moduleSlug: string
): boolean {
  const prefix = `${moduleSlug}.`;
  return permissions.some((p) => p.startsWith(prefix));
}

export function canView(permissions: string[], moduleSlug: string): boolean {
  return hasPermission(permissions, `${moduleSlug}.view`);
}

export function canCreate(permissions: string[], moduleSlug: string): boolean {
  return hasPermission(permissions, `${moduleSlug}.create`);
}

export function canUpdate(permissions: string[], moduleSlug: string): boolean {
  return hasPermission(permissions, `${moduleSlug}.update`);
}

export function canDelete(permissions: string[], moduleSlug: string): boolean {
  return hasPermission(permissions, `${moduleSlug}.delete`);
}
