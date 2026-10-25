"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ShieldPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { isNavGroup, NAV_ITEMS, type NavEntry, type NavGroup, type NavLeaf, type NavLink } from "@/lib/navigation";
import { usePermission } from "@/hooks/usePermission";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type SidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

/** Every nav icon (parent or leaf) reserves this exact box, so labels — top-level or nested — always start at the same x position. */
const ICON_SLOT = "flex size-4.5 shrink-0 items-center justify-center";

function isLeafVisible(item: NavLeaf, has: (permission: string) => boolean): boolean {
  return item.alwaysVisible || (item.permission ? has(item.permission) : false);
}

function useVisibleNavItems(): NavEntry[] {
  const { has } = usePermission();

  return useMemo(
    () =>
      NAV_ITEMS.reduce<NavEntry[]>((acc, entry) => {
        if (isNavGroup(entry)) {
          const children = entry.children.filter((child) => isLeafVisible(child, has));
          if (children.length > 0) acc.push({ ...entry, children });
        } else if (isLeafVisible(entry, has)) {
          acc.push(entry);
        }
        return acc;
      }, []),
    [has]
  );
}

/** The label of whichever visible group contains the currently active route, or `null` if the active route isn't inside any group (e.g. the Dashboard link, or no match). */
function findActiveGroupLabel(items: NavEntry[], pathname: string): string | null {
  for (const entry of items) {
    if (isNavGroup(entry) && entry.children.some((child) => isRouteActive(child.href, pathname))) {
      return entry.label;
    }
  }
  return null;
}

export function Sidebar({ collapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const items = useVisibleNavItems();
  const pathname = usePathname();

  // Single source of truth for which one parent group is expanded — never
  // scattered per-item state. Initialized from the active route, then kept
  // in sync with it: whenever `pathname` changes (a real navigation), the
  // open group is recomputed fresh from the new route, discarding any
  // manual toggle — matching the "navigating elsewhere updates the open
  // parent" requirement. Between navigations (pathname unchanged), manual
  // toggles (open/close via click) are free to win, exactly like the
  // group-local state this replaces used to behave for a single group.
  const [openGroupLabel, setOpenGroupLabel] = useState<string | null>(() => findActiveGroupLabel(items, pathname));
  const [syncedPathname, setSyncedPathname] = useState(pathname);

  if (pathname !== syncedPathname) {
    setSyncedPathname(pathname);
    setOpenGroupLabel(findActiveGroupLabel(items, pathname));
  }

  const toggleGroup = (label: string) => {
    setOpenGroupLabel((current) => (current === label ? null : label));
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-[width,transform] duration-200 lg:sticky lg:top-0 lg:translate-x-0",
          collapsed ? "w-72 lg:w-19" : "w-72",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        aria-label="Admin navigation"
      >
        {/* Header / branding — fixed height, never scrolls. */}
        <div className="flex h-16 shrink-0 items-center justify-between px-4">
          <Link href="/dcs-panel" className="flex items-center gap-2.5 overflow-hidden">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
              <ShieldPlus className="size-4.75" aria-hidden="true" />
            </span>
            <span className={cn("flex min-w-0 flex-col leading-none", collapsed && "lg:hidden")}>
              <span className="truncate text-[13.5px] font-semibold tracking-tight text-sidebar-foreground">
                Day Care Surgeries
              </span>
              <span className="mt-0.5 truncate text-[11px] font-medium text-sidebar-foreground/45">
                Admin Console
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-md p-1.5 text-sidebar-foreground/60 outline-none hover:bg-sidebar-hover hover:text-sidebar-active-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring lg:hidden"
            aria-label="Close navigation menu"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="h-px shrink-0 bg-sidebar-border" />

        {/* Navigation — the only scrollable region; header above stays put. */}
        <nav className="sidebar-nav-scroll min-h-0 flex-1 overflow-y-auto px-3 py-3">
          <ul className="flex flex-col gap-0.5">
            {items.map((entry) =>
              isNavGroup(entry) ? (
                <SidebarGroupItem
                  key={entry.label}
                  group={entry}
                  collapsed={collapsed}
                  pathname={pathname}
                  onNavigate={onCloseMobile}
                  open={openGroupLabel === entry.label}
                  onToggle={() => toggleGroup(entry.label)}
                />
              ) : (
                <SidebarLinkItem
                  key={entry.label}
                  item={entry}
                  collapsed={collapsed}
                  pathname={pathname}
                  onNavigate={onCloseMobile}
                />
              )
            )}
          </ul>
        </nav>
      </aside>
    </>
  );
}

function isRouteActive(href: string, pathname: string): boolean {
  // "/dcs-panel" is the Dashboard's own href but is also a path-prefix of
  // every other admin route, so it can only ever match exactly.
  if (href === "/dcs-panel") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarLinkItem({
  item,
  collapsed,
  pathname,
  onNavigate,
}: {
  item: NavLink;
  collapsed: boolean;
  pathname: string;
  onNavigate: () => void;
}) {
  const active = isRouteActive(item.href, pathname);
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex min-h-9.5 items-center gap-3 rounded-md px-3 text-nav outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        active
          ? "bg-sidebar-active text-sidebar-active-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-sidebar-foreground"
      )}
    >
      {active && (
        <span className="absolute inset-y-1.5 left-0 w-0.75 rounded-full bg-sidebar-primary" aria-hidden="true" />
      )}
      <span className={ICON_SLOT}>
        <Icon className="size-4.5" aria-hidden="true" />
      </span>
      <span className={cn("truncate leading-snug", collapsed && "lg:hidden")}>{item.label}</span>
    </Link>
  );

  return (
    <li>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right" className="hidden lg:inline-flex">
            {item.label}
          </TooltipContent>
        </Tooltip>
      ) : (
        link
      )}
    </li>
  );
}

function SidebarGroupItem({
  group,
  collapsed,
  pathname,
  onNavigate,
  open,
  onToggle,
}: {
  group: NavGroup;
  collapsed: boolean;
  pathname: string;
  onNavigate: () => void;
  /** Whether this group is the single currently-expanded parent — owned by the Sidebar, not this item. */
  open: boolean;
  onToggle: () => void;
}) {
  const isGroupActive = group.children.some((item) => isRouteActive(item.href, pathname));
  const Icon = group.icon;

  const trigger = (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={cn(
        "relative flex min-h-9.5 w-full items-center gap-3 rounded-md px-3 text-nav outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        isGroupActive
          ? "text-sidebar-active-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-sidebar-foreground"
      )}
    >
      {isGroupActive && (
        <span className="absolute inset-y-1.5 left-0 w-0.75 rounded-full bg-sidebar-primary" aria-hidden="true" />
      )}
      <span className={ICON_SLOT}>
        <Icon className="size-4.5" aria-hidden="true" />
      </span>
      <span className={cn("flex-1 truncate text-left leading-snug", collapsed && "lg:hidden")}>
        {group.label}
      </span>
      <ChevronDown
        className={cn(
          "size-4 shrink-0 text-sidebar-foreground/40 transition-transform duration-200",
          open && "rotate-180",
          collapsed && "lg:hidden"
        )}
        aria-hidden="true"
      />
    </button>
  );

  return (
    <li>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent side="right" className="hidden lg:inline-flex">
            {group.label}
          </TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}

      <div
        className={cn(
          "overflow-hidden transition-[max-height] duration-200 ease-out",
          collapsed && "lg:hidden",
          open ? "max-h-249.75" : "max-h-0"
        )}
      >
        <ul className="flex flex-col gap-0.5 pt-0.5 pb-1">
          {group.children.map((item) => {
            const active = isRouteActive(item.href, pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-8.5 items-center gap-3 rounded-md px-3 text-nav-child outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                    active
                      ? "bg-sidebar-active text-sidebar-active-foreground"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-hover hover:text-sidebar-foreground"
                  )}
                >
                  {active && (
                    <span className="absolute inset-y-1.5 left-0 w-0.75 rounded-full bg-sidebar-primary" aria-hidden="true" />
                  )}
                  <span className={ICON_SLOT} aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </li>
  );
}
