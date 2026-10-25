"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { PublicMenuItem } from "@/lib/public/menu-tree";

const TRIGGER_FOCUS_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-(--public-primary)";

type PrimaryMenuNavProps = {
  /** Row 1's CMS primary menu tree, already active-only and city/language-scoped, in the CMS's own `sorting_order` — see `getPublicMenuTree`. */
  items: PublicMenuItem[];
};

/**
 * Desktop rendering of Row 1's CMS primary menu tree. Entirely generic:
 * every label, href, and child comes from `items` (Menu Management), in
 * whatever order the CMS configured — nothing here is keyed off a literal
 * title. Renaming, reordering, adding, or deactivating a Menu Management
 * record changes what renders with zero code change; an item with no
 * active children simply renders as a plain link/label, no dropdown
 * indicator.
 *
 * A parent with children gets a real, stateful disclosure — not a
 * CSS-only `:hover` trick, which can't expose genuine `aria-expanded` or
 * respond to Escape/click-outside:
 *  - Mouse hover still opens it (via `:hover`/`:focus-within` CSS, kept
 *    as a lightweight discoverability aid).
 *  - A dedicated toggle button also opens/closes it on click, Enter, or
 *    Space (native `<button>` semantics), with `aria-expanded` reflecting
 *    real state.
 *  - Escape closes whichever panel is open and returns focus to its
 *    trigger; a click outside this nav closes it too.
 * The panel is visible when EITHER signal is true (CSS hover/focus-within
 * OR the explicit open state), so an explicit click-open never gets
 * fought by the mouse simply moving away.
 */
export function PrimaryMenuNav({ items }: PrimaryMenuNavProps) {
  const [openId, setOpenId] = useState<number | null>(null);
  const navRef = useRef<HTMLUListElement>(null);
  const triggerRefs = useRef<Map<number, HTMLElement>>(new Map());

  useEffect(() => {
    if (openId === null) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      const trigger = openId !== null ? triggerRefs.current.get(openId) : undefined;
      setOpenId(null);
      trigger?.focus();
    }

    function onPointerDown(event: PointerEvent) {
      if (navRef.current && event.target instanceof Node && !navRef.current.contains(event.target)) {
        setOpenId(null);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [openId]);

  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Primary navigation" className="hidden lg:block shrink-0">
      <ul ref={navRef} className="flex items-center gap-1 xl:gap-2 text-sm font-semibold text-white whitespace-nowrap">
        {items.map((item) => {
          const hasChildren = item.children.length > 0;
          const isOpen = openId === item.id;
          const panelId = `primary-menu-${item.id}-panel`;

          const toggle = () => setOpenId((current) => (current === item.id ? null : item.id));
          const registerTrigger = (el: HTMLElement | null) => {
            if (el) triggerRefs.current.set(item.id, el);
            else triggerRefs.current.delete(item.id);
          };

          return (
            <li key={item.id} className="relative group">
              <div className="flex items-center">
                {hasChildren ? (
                  item.href ? (
                    <>
                      <Link
                        href={item.href}
                        className={`px-2 py-2 text-white/90 hover:text-white transition-colors ${TRIGGER_FOCUS_CLASSES}`}
                      >
                        {item.label}
                      </Link>
                      <button
                        ref={registerTrigger}
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        aria-label={`${isOpen ? "Collapse" : "Expand"} ${item.label} menu`}
                        onClick={toggle}
                        className={`flex items-center rounded-sm p-1 text-white/60 hover:text-white transition-colors ${TRIGGER_FOCUS_CLASSES}`}
                      >
                        <ChevronDown
                          className={`size-3 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
                          aria-hidden="true"
                        />
                      </button>
                    </>
                  ) : (
                    <button
                      ref={registerTrigger}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={toggle}
                      className={`flex items-center gap-1 px-2 py-2 text-white/90 hover:text-white transition-colors ${TRIGGER_FOCUS_CLASSES}`}
                    >
                      <span>{item.label}</span>
                      <ChevronDown
                        className={`size-3 text-white/60 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </button>
                  )
                ) : item.href ? (
                  <Link
                    href={item.href}
                    className={`px-2 py-2 text-white/90 hover:text-white transition-colors ${TRIGGER_FOCUS_CLASSES}`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="px-2 py-2 text-white/90 cursor-default">{item.label}</span>
                )}
              </div>

              {hasChildren && (
                <div
                  id={panelId}
                  className={`absolute left-0 top-full pt-2 z-50 transition-all duration-150 ${
                    // Only `group-hover` (mouse discoverability) is layered on
                    // top of the explicit `isOpen` state here — NOT
                    // `group-focus-within`. Escape returns focus to the
                    // trigger button, which is itself inside this `<li>`, so
                    // `:focus-within` would still be true right after closing
                    // and the panel would never actually disappear. Keyboard
                    // open/close is handled entirely by `isOpen` (Enter/Space
                    // toggles it via the button's onClick, Escape clears it).
                    isOpen ? "visible opacity-100" : "invisible opacity-0 group-hover:visible group-hover:opacity-100"
                  }`}
                >
                  <div className="min-w-[200px] bg-white rounded-md shadow-xl border border-slate-100 py-2 max-h-[70vh] overflow-y-auto">
                    {item.children.map((child) =>
                      child.href ? (
                        <Link
                          key={child.id}
                          href={child.href}
                          onClick={() => setOpenId(null)}
                          className="block px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-(--public-accent) transition-colors"
                        >
                          {child.label}
                        </Link>
                      ) : (
                        <span key={child.id} className="block px-4 py-2 text-xs font-medium text-slate-400 cursor-default">
                          {child.label}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
