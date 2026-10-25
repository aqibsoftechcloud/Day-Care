"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, MapPin, Search, Stethoscope, Syringe, UserRound, X, ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSearchUrl } from "@/lib/public/urls";
import type { SearchEntityType, SearchResponse, SearchResultItem } from "@/lib/public/search";

interface SearchBarProps {
  currentCityName?: string | null;
  /** The city `seo_url` of the page being viewed (`null`/undefined = "All Cities"). Sent with every search so city results are prioritised; global results always remain available. */
  citySeoUrl?: string | null;
  /** Which chunk to render — callers render exactly one variant each (the compact mobile header places its search row in a different parent than the desktop Brand Bar). */
  variant: "desktop" | "mobile";
}

const DEBOUNCE_MS = 250;
const MIN_LENGTH = 2;

const GROUPS: { key: keyof SearchResponse["groups"]; label: string; type: SearchEntityType }[] = [
  { key: "doctors", label: "Doctors", type: "doctor" },
  { key: "treatments", label: "Treatments", type: "treatment" },
  { key: "specialities", label: "Specialities", type: "speciality" },
  { key: "hospitals", label: "Hospitals", type: "hospital" },
];

const TYPE_ICON: Record<SearchEntityType, LucideIcon> = {
  doctor: UserRound,
  treatment: Syringe,
  speciality: Stethoscope,
  hospital: Building2,
};

const TYPE_LABEL: Record<SearchEntityType, string> = {
  doctor: "Doctor",
  treatment: "Treatment",
  speciality: "Speciality",
  hospital: "Hospital",
};

type Status = "idle" | "loading" | "ready" | "error";

/**
 * Header search: an ARIA combobox over the public site data.
 *
 * - Live, debounced suggestions from `GET /api/search`, grouped into
 *   Doctors / Treatments / Specialities / Hospitals. Stale responses can
 *   never overwrite newer ones (each request is aborted when superseded and
 *   guarded by a request id).
 * - Arrow Up/Down move through suggestions, Enter opens the highlighted one
 *   (or the full results page when nothing is highlighted), Escape closes
 *   the list and keeps focus in the input, clicking outside closes it.
 * - The current page's city (if any) is sent along, so city results lead;
 *   global treatments/specialities remain in the results (see lib/public/search.ts).
 * - Same component for the desktop pill and the full-width mobile row.
 */
export function SearchBar({ currentCityName, citySeoUrl = null, variant }: SearchBarProps) {
  const router = useRouter();
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [retryTick, setRetryTick] = useState(0);

  const trimmed = query.replace(/\s+/g, " ").trim();
  const canSearch = trimmed.length >= MIN_LENGTH;

  // Flat, ordered list of navigable options: every suggestion, then "search for …".
  const options = useMemo(() => {
    const items: (SearchResultItem | { key: string; type: "all"; href: string })[] = [];
    if (data && data.query === trimmed) for (const group of GROUPS) items.push(...data.groups[group.key]);
    if (canSearch) items.push({ key: "all", type: "all", href: getSearchUrl(trimmed, citySeoUrl) });
    return items;
  }, [data, trimmed, canSearch, citySeoUrl]);

  // Debounced fetch with cancellation.
  useEffect(() => {
    if (!canSearch) {
      requestId.current += 1;
      return;
    }

    const id = ++requestId.current;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setStatus("loading");
      try {
        const params = new URLSearchParams({ q: trimmed, limit: "5" });
        if (citySeoUrl) params.set("city", citySeoUrl);
        const response = await fetch(`/api/search?${params.toString()}`, { signal: controller.signal });
        if (!response.ok) throw new Error(`Search failed (${response.status})`);
        const json = (await response.json()) as SearchResponse & { success: boolean };
        if (id !== requestId.current) return; // a newer request owns the UI now
        setData(json);
        setStatus("ready");
        setActiveIndex(-1);
      } catch (error) {
        if ((error as Error).name === "AbortError" || id !== requestId.current) return;
        setStatus("error");
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, canSearch, citySeoUrl, retryTick]);

  // Click outside closes.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  function submit() {
    if (!canSearch) return;
    const active = options[activeIndex];
    go(active ? active.href : getSearchUrl(trimmed, citySeoUrl));
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (options.length === 0) return;
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => {
        const delta = event.key === "ArrowDown" ? 1 : -1;
        if (current === -1) return delta === 1 ? 0 : options.length - 1;
        return (current + delta + options.length) % options.length;
      });
    } else if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
        inputRef.current?.focus();
      }
    }
  }

  function clear() {
    setQuery("");
    setData(null);
    setStatus("idle");
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  const cityLabel = currentCityName || "All Cities";
  const showPanel = open;
  const ready = status === "ready" && data && data.query === trimmed;
  const noResults = ready && data.total === 0;

  const statusText = !canSearch
    ? ""
    : status === "loading"
      ? "Searching…"
      : status === "error"
        ? "Search is unavailable. Try again."
        : ready
          ? data.total === 0
            ? "No results found."
            : `${data.total} result${data.total === 1 ? "" : "s"} available. Use the up and down arrow keys to review.`
          : "";

  // Index of each group's first option inside `options` (computed up front — no mutation while rendering).
  const groupStart: Record<string, number> = {};
  let running = 0;
  if (data && data.query === trimmed) {
    for (const group of GROUPS) {
      groupStart[group.key] = running;
      running += data.groups[group.key].length;
    }
  }
  const allOptionIndex = running;

  const panel = showPanel && (
    <div
      data-search-panel
      className={cn(
        "absolute top-full z-50 mt-2 max-h-[min(26rem,70vh)] overflow-y-auto rounded-xl border border-slate-200 bg-white text-left shadow-xl",
        variant === "desktop" ? "left-0 w-[min(28rem,calc(100vw-2rem))]" : "inset-x-0"
      )}
    >
      {!canSearch && (
        <p className="px-4 py-4 text-sm text-slate-500">
          Type at least {MIN_LENGTH} characters to search doctors, treatments, specialities and hospitals.
        </p>
      )}

      {canSearch && status === "loading" && !ready && (
        <p className="flex items-center gap-2 px-4 py-4 text-sm text-slate-500">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Searching…
        </p>
      )}

      {canSearch && status === "error" && (
        <div className="flex items-center justify-between gap-3 px-4 py-4 text-sm">
          <span className="text-slate-600">Search is temporarily unavailable.</span>
          <button
            type="button"
            onClick={() => {
              setStatus("loading");
              setRetryTick((tick) => tick + 1);
            }}
            className="shrink-0 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-(--public-primary) hover:border-(--public-accent)/40 hover:text-(--public-accent) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent)"
          >
            Retry
          </button>
        </div>
      )}

      {noResults && (
        <p className="px-4 pt-4 pb-2 text-sm text-slate-600">
          No results found for <span className="font-semibold text-slate-900">&ldquo;{trimmed}&rdquo;</span>.
        </p>
      )}

      {canSearch && ready && (
        <ul id={listboxId} role="listbox" aria-label="Search suggestions" className="py-1">
          {GROUPS.map((group) => {
            const items = data.groups[group.key];
            if (items.length === 0) return null;
            return (
              <li key={group.key} role="presentation">
                <p className="px-4 pt-2.5 pb-1 text-[0.6875rem] font-bold tracking-wider text-slate-400 uppercase" role="presentation">
                  {group.label}
                </p>
                <ul role="presentation">
                  {items.map((item, itemIndex) => {
                    const index = groupStart[group.key] + itemIndex;
                    const Icon = TYPE_ICON[item.type];
                    return (
                      <li
                        key={item.key}
                        id={`${baseId}-opt-${index}`}
                        role="option"
                        aria-selected={index === activeIndex}
                        onMouseEnter={() => setActiveIndex(index)}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => go(item.href)}
                        className={cn("flex cursor-pointer items-center gap-3 px-4 py-2", index === activeIndex ? "bg-(--public-primary)/6" : "hover:bg-slate-50")}
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--public-primary)/8 text-(--public-primary)">
                          <Icon className="size-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-900">{item.title}</span>
                          {item.subtitle && <span className="block truncate text-xs text-slate-500">{item.subtitle}</span>}
                        </span>
                        <span className="shrink-0 rounded-full bg-(--public-accent)/10 px-2 py-0.5 text-[0.625rem] font-bold tracking-wide text-(--public-accent) uppercase">
                          {TYPE_LABEL[item.type]}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}

          <li role="presentation" className="mt-1 border-t border-slate-100">
            {(() => {
              const index = allOptionIndex;
              return (
                <div
                  id={`${baseId}-opt-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => go(getSearchUrl(trimmed, citySeoUrl))}
                  className={cn("flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-semibold text-(--public-primary)", index === activeIndex ? "bg-(--public-primary)/6" : "hover:bg-slate-50")}
                >
                  <Search className="size-4 shrink-0 text-(--public-accent)" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">Search for &ldquo;{trimmed}&rdquo;</span>
                  <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
                </div>
              );
            })()}
          </li>
        </ul>
      )}
    </div>
  );

  const activeId = activeIndex >= 0 && ready ? `${baseId}-opt-${activeIndex}` : undefined;

  const input = (
    <input
      ref={inputRef}
      type="text"
      role="combobox"
      aria-label="Search doctors, treatments, specialities and hospitals"
      aria-expanded={showPanel}
      aria-controls={listboxId}
      aria-activedescendant={activeId}
      aria-autocomplete="list"
      autoComplete="off"
      spellCheck={false}
      value={query}
      placeholder={variant === "desktop" ? "Search doctors, treatments…" : "Search doctors, treatments, specialities…"}
      onChange={(e) => {
        setQuery(e.target.value);
        setOpen(true);
        setActiveIndex(-1);
        if (status === "ready") setStatus("loading");
      }}
      onFocus={() => setOpen(true)}
      onKeyDown={onKeyDown}
      maxLength={80}
      className={cn(
        "w-full min-w-0 bg-transparent text-slate-800 outline-none placeholder:text-slate-400",
        variant === "desktop" ? "pr-14 text-xs" : "h-10 pr-16 pl-9 text-sm"
      )}
    />
  );

  const controls = (
    <span className="absolute right-1 flex items-center">
      {query && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={clear}
          className="flex size-6 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent)"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}
      <button
        type="submit"
        aria-label="Search"
        disabled={!canSearch}
        className="flex size-7 items-center justify-center rounded-md text-slate-500 hover:text-(--public-accent) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) disabled:opacity-50"
      >
        <Search className="size-4" aria-hidden="true" />
      </button>
    </span>
  );

  const live = (
    <span className="sr-only" role="status" aria-live="polite">
      {statusText}
    </span>
  );

  if (variant === "desktop") {
    return (
      <div ref={rootRef} className="relative hidden min-w-0 max-w-xs flex-1 items-center lg:flex xl:max-w-sm">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex h-9 w-full items-center overflow-hidden rounded-lg border border-white/40 bg-white/95 text-sm focus-within:ring-2 focus-within:ring-(--public-accent)"
        >
          {/* City segment: the page's city context (changed with the city selector at the right of the header). */}
          <div className="flex max-w-[38%] min-w-[84px] items-center gap-1.5 border-r border-slate-200 bg-slate-50 px-2.5 text-slate-700 select-none" title="Searching in">
            <MapPin className="size-3.5 shrink-0 text-(--public-accent)" aria-hidden="true" />
            <span className="w-full truncate text-xs font-medium text-slate-800">{cityLabel}</span>
          </div>

          <div className="relative flex min-w-0 flex-1 items-center px-2.5">
            {input}
            {controls}
          </div>
        </form>
        {panel}
        {live}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative w-full min-w-0">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="relative flex w-full min-w-0 items-center rounded-lg border border-slate-200 bg-slate-50 focus-within:border-(--public-accent) focus-within:ring-2 focus-within:ring-(--public-accent)/30"
      >
        <Search className="pointer-events-none absolute left-3 size-4 text-slate-400" aria-hidden="true" />
        {input}
        {controls}
      </form>
      {panel}
      {live}
    </div>
  );
}
