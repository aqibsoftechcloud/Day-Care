"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";
import { cn } from "cn";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type SearchableSelectOption = {
  value: number;
  label: string;
};

type SearchableSelectProps = {
  options: SearchableSelectOption[];
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
};

/**
 * Single-value counterpart to `SearchableMultiSelect` — same searchable
 * popover mechanics (options only exist in the DOM while open, filtered
 * by a search box, never a permanent list in the form), but commits one
 * value and closes on selection, and shows the selected option's own
 * label in the trigger rather than always showing the placeholder (the
 * natural single-select convention, unlike the multi-select's chip row).
 * Used for optional single-FK pickers backed by a catalog too large for
 * a plain `<Select>` dropdown (e.g. Testimonials' Speciality field).
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Search and select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  loading = false,
  disabled = false,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOption = useMemo(() => options.find((option) => option.value === value) ?? null, [options, value]);

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.label.toLowerCase().includes(q));
  }, [options, search]);

  const selectValue = (next: number) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled || loading}
          className={cn(
            "flex h-8 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent px-2.5 text-base transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 dark:hover:bg-input/50",
            !selectedOption && "text-muted-foreground",
            className
          )}
        >
          <span className="flex flex-1 items-center gap-1.5 truncate">
            {loading ? (
              <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="size-3.5 shrink-0" aria-hidden="true" />
            )}
            <span className="truncate">{loading ? "Loading…" : (selectedOption?.label ?? placeholder)}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {selectedOption && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
                aria-label="Clear selection"
                className="rounded-full p-0.5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
              >
                <X className="size-3.5" aria-hidden="true" />
              </span>
            )}
            <ChevronDown className="size-4 shrink-0" aria-hidden="true" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] gap-0 p-0">
        <div className="flex items-center gap-2 border-b border-border px-2.5 py-2">
          <Search className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-6 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div role="listbox" className="max-h-56 overflow-y-auto p-1">
          {filteredOptions.length === 0 ? (
            <p className="px-2.5 py-3 text-center text-body-sm text-muted-foreground">{emptyText}</p>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  type="button"
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => selectValue(option.value)}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted/50"
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-sm border border-input",
                      isSelected && "border-primary bg-primary text-primary-foreground"
                    )}
                    aria-hidden="true"
                  >
                    {isSelected && <Check className="size-3" />}
                  </span>
                  <span className="truncate text-foreground">{option.label}</span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
