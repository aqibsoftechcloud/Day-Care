import { useAuth } from "@/hooks/useAuth";
import {
  canCreate,
  canDelete,
  canUpdate,
  canView,
  hasAnyModulePermission,
  hasPermission,
} from "@/lib/auth/permissions";

/**
 * Convenience hook wrapping lib/auth/permissions against the current
 * user's runtime permission list. UX-only — see lib/auth/permissions.ts.
 */
export function usePermission() {
  const { permissions } = useAuth();

  return {
    permissions,
    has: (permission: string) => hasPermission(permissions, permission),
    hasAnyForModule: (moduleSlug: string) =>
      hasAnyModulePermission(permissions, moduleSlug),
    canView: (moduleSlug: string) => canView(permissions, moduleSlug),
    canCreate: (moduleSlug: string) => canCreate(permissions, moduleSlug),
    canUpdate: (moduleSlug: string) => canUpdate(permissions, moduleSlug),
    canDelete: (moduleSlug: string) => canDelete(permissions, moduleSlug),
  };
}
