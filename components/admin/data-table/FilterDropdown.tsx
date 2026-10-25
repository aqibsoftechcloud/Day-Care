"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FilterOption = { label: string; value: string };

type FilterDropdownProps = {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  className?: string;
};

/** Single-select filter control (e.g. status) — pairs with SearchInput in a DataTable toolbar. */
export function FilterDropdown({
  label,
  value,
  options,
  onChange,
  className,
}: FilterDropdownProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={`h-9 min-w-36 rounded-lg text-[13.5px] ${className ?? ""}`}
        aria-label={label}
      >
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
