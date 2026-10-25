import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type BreadcrumbEntry = {
  label: string;
  /** Omit for the current page (always the last entry) or for a level that has no page of its own. */
  href?: string;
};

type PublicBreadcrumbProps = {
  /** Ordered from the root ("Home") to the current page; built by each route from its real content hierarchy, never from raw URL slugs. */
  items: BreadcrumbEntry[];
  /** `light` for white/slate surfaces, `dark` for navy hero banners. */
  tone?: "light" | "dark";
  className?: string;
};

/**
 * The one breadcrumb for the whole public site: a semantic
 * `<nav aria-label="Breadcrumb">` with an ordered list, chevron separators
 * hidden from assistive tech, visible keyboard focus, and the last entry
 * rendered as plain text with `aria-current="page"` (never a link to the
 * page you're already on). Compact (`text-xs`) and wrapping, so long
 * titles never cause horizontal overflow on mobile. A Server Component —
 * no client JS.
 */
export function PublicBreadcrumb({ items, tone = "light", className }: PublicBreadcrumbProps) {
  const dark = tone === "dark";

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className={cn("flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs", dark ? "text-white/60" : "text-slate-500")}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${index}-${item.label}`} className="inline-flex min-w-0 items-center gap-1.5">
              {index > 0 && <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={cn(
                    "rounded-sm py-1 transition-colors focus-visible:outline-none focus-visible:ring-2",
                    dark ? "hover:text-white focus-visible:ring-white" : "hover:text-(--public-primary) focus-visible:ring-(--public-accent)"
                  )}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn("py-1 font-medium break-words", dark ? "text-white" : "text-(--public-primary)")}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
