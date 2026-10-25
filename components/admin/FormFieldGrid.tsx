import type { ComponentProps } from "react";
import { FieldGroup } from "@/components/ui/field";
import { cn } from "@/lib/utils";

/**
 * Two-column responsive field layout for CMS create/edit forms — short
 * fields sit side by side on tablet/desktop and stack to a single column
 * on mobile, so a form doesn't have to be one long vertical list just
 * because that's the simplest layout. Wrap any field that should span
 * both columns (a long textarea, a standalone primary field) with a
 * `sm:col-span-2` className on that `Field`.
 *
 * Drop-in replacement for `FieldGroup` wherever a form's fields are
 * short enough to pair up — Roles/Users intentionally keep using plain
 * `FieldGroup` since their forms are narrow single-column dialogs.
 */
export function FormFieldGrid({ className, ...props }: ComponentProps<typeof FieldGroup>) {
  return <FieldGroup className={cn("grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2", className)} {...props} />;
}
