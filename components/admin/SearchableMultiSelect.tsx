"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type SearchableMultiSelectOption = {
  value: number;
  label: string;
};

type SearchableMultiSelectProps = {
  options: SearchableMultiSelectOption[];
  selected: number[];
  onChange: (values: number[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
};

/**
 * Generic searchable multi-select combobox for catalogs too large for an
 * inline checkbox wall (100+ rows): options are filtered by the search box
 * and only exist in the DOM while the popover is open, never rendered
 * permanently in the form. Selected values surface as removable chips
 * below the trigger. Shared by Doctor Specialities and Hospitals in
 * DoctorFormDialog rather than duplicated per field — every option row is
 * a plain styled `button`, not the `Checkbox` primitive, since Radix's
 * Checkbox renders its own `<button>` and nesting one inside this row's
 * button would be invalid, click-swallowing markup.
 */
export function SearchableMultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Search and select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  loading = false,
  disabled = false,
  className,
}: SearchableMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const selectedOptions = useMemo(
    () => options.filter((option) => selectedSet.has(option.value)),
    [options, selectedSet]
  );

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.label.toLowerCase().includes(q));
  }, [options, search]);

  const toggleValue = (value: number) => {
    if (selectedSet.has(value)) {
      onChange(selected.filter((id) => id !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const removeValue = (value: number) => {
    onChange(selected.filter((id) => id !== value));
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
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
            className="flex h-8 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent px-2.5 text-base text-muted-foreground transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 dark:hover:bg-input/50"
          >
            <span className="flex items-center gap-1.5 truncate">
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Search className="size-3.5" aria-hidden="true" />
              )}
              {loading ? "Loading…" : placeholder}
            </span>
            <ChevronDown className="size-4 shrink-0" aria-hidden="true" />
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
          <div role="listbox" aria-multiselectable="true" className="max-h-56 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <p className="px-2.5 py-3 text-center text-body-sm text-muted-foreground">{emptyText}</p>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedSet.has(option.value);
                return (
                  <button
                    type="button"
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => toggleValue(option.value)}
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

      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedOptions.map((option) => (
            <Badge key={option.value} variant="secondary" className="gap-1 py-1 pr-1">
              {option.label}
              <button
                type="button"
                onClick={() => removeValue(option.value)}
                aria-label={`Remove ${option.label}`}
                className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
