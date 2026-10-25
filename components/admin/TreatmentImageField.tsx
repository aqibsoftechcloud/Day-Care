"use client";

import { FileUploadArea } from "@/components/admin/FileUploadArea";
import { Field, FieldLabel } from "@/components/ui/field";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const IMAGE_HINT = "JPG, PNG, WEBP or GIF, up to 5MB";

type TreatmentImageFieldProps = {
  label: string;
  /** One line under the label explaining where this image is shown. */
  description: string;
  /** The currently stored image URL (edit mode), or null/undefined when none. */
  currentUrl?: string | null;
  files: File[];
  onFilesChange: (files: File[]) => void;
  /** Whether the admin has marked the stored image for removal. Omit `onRemove` to hide the Remove button (field has no remove support). */
  removed?: boolean;
  onRemove?: () => void;
  disabled?: boolean;
};

/**
 * One optional image slot (upload / preview / replace / remove) shared by
 * the Global Treatment and City Treatment forms, so the hero image and the
 * card icon look and behave identically in both. State is owned by the
 * caller — each slot gets its own `files`/`removed` pair, which is what
 * keeps the two images independent.
 */
export function TreatmentImageField({
  label,
  description,
  currentUrl,
  files,
  onFilesChange,
  removed = false,
  onRemove,
  disabled,
}: TreatmentImageFieldProps) {
  return (
    <Field className="sm:col-span-2">
      <FieldLabel>
        {label} <span className="text-muted-foreground">(optional)</span>
      </FieldLabel>
      <p className="text-body-sm text-muted-foreground">{description}</p>
      {currentUrl && !removed && files.length === 0 && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- small preview of the currently stored image. */}
          <img src={currentUrl} alt="" className="size-10 shrink-0 rounded-md border border-border object-contain" />
          <span className="flex-1 text-body-sm text-muted-foreground">Current image — upload a new file to replace it.</span>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              className="shrink-0 text-body-sm font-medium text-destructive hover:underline disabled:pointer-events-none disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>
      )}
      <FileUploadArea files={files} onFilesChange={onFilesChange} accept={IMAGE_ACCEPT} hint={IMAGE_HINT} disabled={disabled} />
    </Field>
  );
}
