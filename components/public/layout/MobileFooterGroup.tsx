"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

type MobileFooterGroupProps = {
  title: string;
  children: React.ReactNode;
};

/**
 * One collapsible footer section on mobile (`lg:hidden` — the desktop
 * grid renders the same links as a static `FooterColumn` instead). A
 * controlled `<button aria-expanded>` rather than native
 * `<details>/<summary>` so the expanded state is explicit for assistive
 * tech and the chevron/height transition can be authored directly.
 * Height animates via the CSS grid-rows trick (`grid-rows-[0fr]` <->
 * `[1fr]`) instead of a measured pixel height, so no ResizeObserver/JS
 * measurement is needed; `motion-reduce:transition-none` drops the
 * animation entirely for users who asked for less motion.
 */
export function MobileFooterGroup({ title, children }: MobileFooterGroupProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="border-b border-white/10 lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between py-4 text-left text-sm font-bold tracking-wide text-white uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--public-primary)"
      >
        {title}
        <ChevronDown
          className={`size-4 shrink-0 text-white/60 transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      <div
        id={panelId}
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-3 pb-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
