"use client";

import { useState } from "react";
import { FileUploadArea } from "@/components/admin/FileUploadArea";
import { Field, FieldLabel } from "@/components/ui/field";

export type SectionImageValue = {
  /** The currently stored path (`/uploads/page-sections/...`), or `null` if none/removed. */
  path: string | null;
  /** A newly picked, not-yet-uploaded file — uploaded on save (see PageSectionFieldsForm). `undefined` means no pending change. */
  pendingFile?: File;
};

type SectionImageFieldProps = {
  label: string;
  value: SectionImageValue;
  onChange: (value: SectionImageValue) => void;
  disabled?: boolean;
};

/**
 * One image slot inside a section's content form — same
 * `FileUploadArea`/upload-on-save convention as every other admin image
 * field in this project (Testimonial/Doctor/Speciality/...), just
 * decoupled from a single fixed multipart field name since a Features
 * section can have any number of these at once (see
 * services/page-section.service.ts's `uploadPageSectionImage`).
 */
export function SectionImageField({ label, value, onChange, disabled }: SectionImageFieldProps) {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <Field>
      <FieldLabel>
        {label} <span className="text-muted-foreground">(optional)</span>
      </FieldLabel>
      {value.path && !value.pendingFile && (
        <div className="mb-2 flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- small preview of the currently stored, same-origin section image. */}
          <img src={value.path} alt="" className="size-10 rounded-md border border-border object-contain" />
          <span className="text-body-sm text-muted-foreground">Current image — upload a new file to replace it.</span>
          <button
            type="button"
            onClick={() => onChange({ path: null, pendingFile: undefined })}
            disabled={disabled}
            className="ml-auto shrink-0 text-body-sm font-medium text-destructive hover:underline disabled:pointer-events-none disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      )}
      <FileUploadArea
        files={files}
        onFilesChange={(next) => {
          setFiles(next);
          onChange({ path: value.path, pendingFile: next[0] });
        }}
        accept="image/jpeg,image/png,image/webp,image/gif"
        hint="JPG, PNG, WEBP or GIF, up to 5MB"
        disabled={disabled}
      />
    </Field>
  );
}
