/** Centralized TanStack Query keys for the Menu Management feature. */
export const menusKeys = {
  all: ["menus"] as const,
  detail: (id: number) => ["menus", id] as const,
  /** The Add/Edit form's Parent Menu dropdown — one cache entry per city, since its options must never mix cities. */
  parentOptions: (cityId: number) => ["menus", "parent-options", cityId] as const,
  /** Same dropdown when the menu being created/edited is itself global (`city_id: null`) — a separate cache entry from any city's, since global parent options are a disjoint set (see services/menu.service.ts's ensureParentExists). */
  parentOptionsGlobal: () => ["menus", "parent-options", "global"] as const,
};
