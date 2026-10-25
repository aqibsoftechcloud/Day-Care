"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicCity } from "@/lib/public/cities";

type CitySelectorProps = {
  cities: PublicCity[];
  /**
   * The active city for the page currently being viewed, or `null` when
   * the current route has no city context (the nationwide homepage, a
   * generic CMS page, 404, …). Resolved by the caller from the URL — this
   * component never guesses or defaults to the first city in the list.
   */
  currentCityId: number | null;
};

/**
 * Client Component: only the dropdown's open/closed state and keyboard
 * interaction require this — the city list itself is server-fetched and
 * passed in as a prop.
 */
export function CitySelector({ cities, currentCityId }: CitySelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const router = useRouter();

  const currentCity = cities.find((city) => city.id === currentCityId) ?? null;
  const hasCities = cities.length > 0;

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleOptionKeyDown(event: React.KeyboardEvent, index: number) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      optionRefs.current[index + 1]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      optionRefs.current[index - 1]?.focus();
    }
  }

  function selectCity(city: PublicCity) {
    setOpen(false);
    router.push(city.href);
  }

  /**
   * "All Cities" is an explicit, selectable global state — not "nothing
   * picked yet" — so it navigates to the nationwide homepage ("/", the
   * same literal every other public component uses for city-independent
   * "home," e.g. PublicFooter's `homeHref`/GlobalHero's breadcrumb) rather
   * than leaving the current city-scoped page in place. It deliberately
   * does NOT try to resolve "the global equivalent of the current page" —
   * most entity types (doctors, hospitals, per-city listings) have no
   * global equivalent at all, so a content-preserving switch would be
   * inconsistent across page types; always landing on "/" is the one
   * behavior that's correct for every page this control appears on.
   */
  function selectAllCities() {
    setOpen(false);
    router.push("/");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={!hasCities}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={currentCity ? `Current city: ${currentCity.name}. Change city` : "Current: All Cities. Change city"}
        className={cn(
          "flex h-10 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition-colors",
          "hover:border-slate-300 hover:bg-slate-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2",
          !hasCities && "cursor-not-allowed opacity-50"
        )}
      >
        <MapPin className="size-4 shrink-0 text-(--public-accent)" aria-hidden="true" />
        <span className="max-w-28 truncate sm:max-w-36">
          {hasCities ? (currentCity ? currentCity.name : "All Cities") : "No cities available"}
        </span>
        <ChevronDown
          className={cn("size-3.5 shrink-0 text-slate-400 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Cities"
          aria-activedescendant={currentCity ? `city-option-${currentCity.id}` : "city-option-all"}
          className="absolute right-0 z-50 mt-2 max-h-72 w-52 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl"
        >
          <button
            id="city-option-all"
            ref={(element) => {
              optionRefs.current[0] = element;
            }}
            type="button"
            role="option"
            aria-selected={currentCityId === null}
            onClick={selectAllCities}
            onKeyDown={(event) => handleOptionKeyDown(event, 0)}
            className={cn(
              "flex w-full items-center justify-between border-b border-slate-100 px-3.5 py-2 text-left text-sm transition-colors",
              "hover:bg-slate-50 focus-visible:outline-none focus-visible:bg-slate-50",
              currentCityId === null ? "font-semibold text-(--public-accent)" : "text-slate-700"
            )}
          >
            All Cities
          </button>

          {hasCities &&
            cities.map((city, index) => {
              const selected = city.id === currentCityId;
              return (
                <button
                  key={city.id}
                  id={`city-option-${city.id}`}
                  ref={(element) => {
                    optionRefs.current[index + 1] = element;
                  }}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => selectCity(city)}
                  onKeyDown={(event) => handleOptionKeyDown(event, index + 1)}
                  className={cn(
                    "flex w-full items-center justify-between px-3.5 py-2 text-left text-sm transition-colors",
                    "hover:bg-slate-50 focus-visible:outline-none focus-visible:bg-slate-50",
                    selected ? "font-semibold text-(--public-accent)" : "text-slate-700"
                  )}
                >
                  {city.name}
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}
