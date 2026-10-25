"use client";

import { useEffect, useRef, useState } from "react";

const TABS = [
  { id: "hospital-about-heading", label: "About" },
  { id: "hospital-doctors-heading", label: "Doctors" },
  { id: "hospital-gallery-heading", label: "Photos" },
  { id: "hospital-reviews-heading", label: "Reviews" },
] as const;

/**
 * Compact in-page nav directly below the hospital profile header. Each tab
 * is a plain `<a href="#section-id">` (works even if JS hasn't hydrated
 * yet); the active-tab highlight is a progressive enhancement layered on
 * top via `IntersectionObserver`, not a requirement for the tabs to
 * function.
 *
 * Not CSS-sticky: `PublicHeader` is itself `sticky top-0` with a height
 * that varies (brand bar + an optional wrapped specialities row), so a
 * second `sticky top-0` bar here would either hide underneath it or need
 * a brittle hardcoded offset that drifts out of sync. A plain in-flow bar
 * avoids that coupling entirely.
 *
 * Horizontal-scrollable with hidden scrollbar on narrow screens so 4 tabs
 * never wrap or force page-level horizontal overflow at 390px — same
 * "scrollable row, not a cramped wrap" idiom already used by
 * SecondaryNavBar's desktop Row 2.
 */
export function HospitalTabs() {
  const [activeId, setActiveId] = useState<string>(TABS[0].id);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const sections = TABS.map((tab) => document.getElementById(tab.id)).filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
        setActiveId(topMost.target.id);
      },
      { rootMargin: "-140px 0px -65% 0px", threshold: 0 }
    );

    for (const section of sections) {
      observerRef.current.observe(section);
    }

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <nav aria-label="Hospital sections" className="border-b border-slate-200 bg-white">
      <div className="public-container">
        <ul className="scrollbar-none flex gap-1 overflow-x-auto py-1">
          {TABS.map((tab) => {
            const isActive = activeId === tab.id;
            return (
              <li key={tab.id} className="shrink-0">
                <a
                  href={`#${tab.id}`}
                  aria-current={isActive ? "true" : undefined}
                  className={`block border-b-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2 ${
                    isActive
                      ? "border-(--public-accent) text-(--public-primary)"
                      : "border-transparent text-slate-500 hover:text-(--public-primary)"
                  }`}
                >
                  {tab.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
