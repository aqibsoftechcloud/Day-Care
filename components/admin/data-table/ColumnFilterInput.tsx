"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type ColumnFilterInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Debounce delay before the committed `onChange` fires — keeps a server-backed filter from firing on every keystroke. */
  delay?: number;
};

/**
 * Compact filter input meant to sit directly under a table column header,
 * for the one specific field the underlying API actually supports
 * filtering on (e.g. an exact-match `email`/`country`/`status` query
 * param) — not a general multi-field search box.
 */
export function ColumnFilterInput({ value, onChange, placeholder, delay = 400 }: ColumnFilterInputProps) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(local);
    }, delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally omits `onChange`/`delay` so typing doesn't reset the debounce timer if the caller re-renders with a new inline callback.
  }, [local]);

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/60"
        aria-hidden="true"
      />
      <Input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-7 rounded-md pl-6 text-[12.5px] font-normal"
      />
    </div>
  );
}
