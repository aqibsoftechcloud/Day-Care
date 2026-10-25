import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAuthenticatedUser,
  UnauthenticatedError,
  type SafeSessionUser,
} from "@/lib/session/session";

export { UnauthenticatedError };

export class ForbiddenError extends Error {
  constructor(moduleSlug: string, actionSlug: string) {
    super(`You do not have permission to ${actionSlug} ${moduleSlug}`);
    this.name = "ForbiddenError";
  }
}

/**
 * Resolves whether the given role currently has the given module+action
 * permission, via the actual relational chain:
 * role_permissions -> permissions -> modules + actions. Always queried
 * live — nothing about this is cached or trusted from the JWT.
 */
async function roleHasPermission(
  roleId: number,
  moduleSlug: string,
  actionSlug: string
): Promise<boolean> {
  const match = await prisma.role_permissions.findFirst({
    where: {
      role_id: roleId,
      permissions: {
        modules: { slug: moduleSlug },
        actions: { slug: actionSlug },
      },
    },
    select: { role_id: true },
  });

  return match !== null;
}

/**
 * Returns every permission the given role currently holds, formatted as
 * "<module-slug>.<action-slug>" strings (e.g. "roles.view"). Used only by
 * GET /api/auth/me to tell the currently-authenticated user their own
 * permission set — never accepts a role id from client input, always the
 * caller's own already-authenticated role.
 */
export async function getRolePermissionSlugs(roleId: number): Promise<string[]> {
  const rows = await prisma.role_permissions.findMany({
    where: { role_id: roleId },
    select: {
      permissions: {
        select: {
          modules: { select: { slug: true } },
          actions: { select: { slug: true } },
        },
      },
    },
  });

  return rows.map(
    (row) => `${row.permissions.modules.slug}.${row.permissions.actions.slug}`
  );
}

/**
 * The single reusable authorization guard for protected CMS routes.
 *
 * 1. Verifies the JWT and resolves the current user (via the existing
 *    session layer) — throws `UnauthenticatedError` if there is no
 *    valid session or the user is not currently active. Role and status
 *    are always read fresh from the database inside that step, so a
 *    role change or deactivation takes effect on the very next request
 *    regardless of the JWT's remaining validity.
 * 2. Checks whether the user's CURRENT role (re-resolved above, never
 *    trusted from the JWT) has the requested module+action permission —
 *    throws `ForbiddenError` if not.
 *
 * Callers should let both errors propagate to their existing
 * `handleError()` and call `tryHandleAuthorizationError()` first inside
 * it (see below) to map them to 401/403.
 */
export async function requirePermission(
  moduleSlug: string,
  actionSlug: string
): Promise<SafeSessionUser> {
  const user = await requireAuthenticatedUser();

  const authorized = await roleHasPermission(
    user.role.id,
    moduleSlug,
    actionSlug
  );

  if (!authorized) {
    throw new ForbiddenError(moduleSlug, actionSlug);
  }

  return user;
}

/**
 * Maps the two authorization-specific errors to their HTTP responses.
 * Returns `null` for any other error so a controller's own
 * `handleError()` can call this first and fall through to its existing
 * logic — this is the one shared place that owns the 401/403 response
 * shape, so it is never duplicated per controller.
 */
export function tryHandleAuthorizationError(
  error: unknown
): NextResponse | null {
  if (error instanceof UnauthenticatedError) {
    return NextResponse.json(
      { success: false, message: "Authentication required" },
      { status: 401 }
    );
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 403 }
    );
  }

  return null;
}
