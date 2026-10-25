import type { MenuPlacement } from "@/types/menu";

/**
 * Pure, client-safe menu-tree types/helpers — deliberately split out of
 * `lib/public/menu.ts`, which also pulls in server-only CMS services
 * (Prisma, the DB driver) to build `PublicMenuItem[]` in the first
 * place. A Client Component (`MobileMenu`) needs `splitByPlacement` at
 * runtime, and importing it from `lib/public/menu.ts` directly would
 * drag that entire server-only import graph into the browser bundle —
 * this file has none of that, only plain data shaping.
 */
export type PublicMenuItem = {
  id: number;
  label: string;
  /** `null` for a pure grouping/dropdown parent (`target_type: "none"`) — never a broken link. */
  href: string | null;
  /** The row/region this item belongs in — only meaningful (and only read by `splitByPlacement`) on a top-level item; a child inherits its parent's placement implicitly by rendering wherever the parent renders. */
  placement: MenuPlacement;
  children: PublicMenuItem[];
};

/**
 * Splits one already-built menu tree into its `primary`/`secondary`/
 * `footer` rows by each TOP-LEVEL item's own `placement` — a pure,
 * synchronous filter, never a second query. A child's `placement` is
 * irrelevant here (and never inspected): it renders wherever its
 * parent renders, so only the root items are partitioned.
 */
export function splitByPlacement(tree: PublicMenuItem[]): {
  primary: PublicMenuItem[];
  secondary: PublicMenuItem[];
  footer: PublicMenuItem[];
} {
  return {
    primary: tree.filter((item) => item.placement === "primary"),
    secondary: tree.filter((item) => item.placement === "secondary"),
    footer: tree.filter((item) => item.placement === "footer"),
  };
}
