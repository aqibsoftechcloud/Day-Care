"use client";

import { useEffect, useState } from "react";

type DoctorNavigationProps = {
  /** Which anchor tabs to render, in order — the caller passes only the ids/labels for sections that actually render on this page (e.g. no "Hospitals" tab when the doctor has no `doctor_hospitals` rows). Mirrors `HospitalTabs`'s own "navigation anchors, not a fixed fake tab set" approach. */
  items: { id: string; label: string }[];
};

/**
 * Compact in-page nav, same structural pattern as `HospitalTabs.tsx`
 * (plain anchor links, progressive-enhancement active-state highlight via
 * `IntersectionObserver`, not CSS-sticky — see that component's own doc
 * comment for why). No "Reviews"/"Services" tabs: those sections don't
 * exist on this page (no real data source for either yet), so this never
 * renders a tab pointing at nothing.
 */
export function DoctorNavigation({ items }: DoctorNavigationProps) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    const sections = items.map((item) => document.getElementById(item.id)).filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
        setActiveId(topMost.target.id);
      },
      { rootMargin: "-140px 0px -65% 0px", threshold: 0 }
    );

    for (const section of sections) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav aria-label="Doctor sections" className="border-b border-slate-200 bg-white">
      <div className="public-container">
        <ul className="scrollbar-none flex gap-1 overflow-x-auto py-1">
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <li key={item.id} className="shrink-0">
                <a
                  href={`#${item.id}`}
                  aria-current={isActive ? "true" : undefined}
                  className={`block border-b-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2 ${
                    isActive
                      ? "border-(--public-accent) text-(--public-primary)"
                      : "border-transparent text-slate-500 hover:text-(--public-primary)"
                  }`}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
