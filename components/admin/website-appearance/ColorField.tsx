"use client";

import { useId } from "react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

type ColorFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

/**
 * One color token: native color-picker swatch + editable hex text input,
 * kept in sync both ways. The swatch doubles as the live preview the
 * brief asks for — no separate preview element needed per field.
 */
export function ColorField({ label, value, onChange, error }: ColorFieldProps) {
  const id = useId();
  const isValidHex = HEX_PATTERN.test(value);

  return (
    <Field data-invalid={!!error || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} color picker`}
          value={isValidHex ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="size-8 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-0.5"
        />
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          aria-invalid={!!error || undefined}
          className="font-mono"
          maxLength={7}
        />
      </div>
      <FieldError errors={[error ? { message: error } : undefined]} />
    </Field>
  );
}
