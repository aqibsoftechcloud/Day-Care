"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { File as FileIcon, UploadCloud, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FilePreviewThumb({ file }: { file: File }) {
  const url = useMemo(
    () => (file.type.startsWith("image/") ? URL.createObjectURL(file) : null),
    [file]
  );

  // Cleanup-only effect — nothing here calls setState, it just releases
  // the object URL when this file is removed or swapped out.
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  if (!url) {
    return (
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <FileIcon className="size-4" aria-hidden="true" />
      </span>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element -- transient local object URL, not a served asset.
  return <img src={url} alt="" className="size-8 shrink-0 rounded-md object-cover" />;
}

type FileUploadAreaProps = {
  files: File[];
  onFilesChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  /** Shown under the drop zone, e.g. "PNG or JPG, up to 5MB". */
  hint?: string;
  /** Validation message — renders in the destructive tone and outlines the drop zone. */
  error?: string;
  /** 0–100. Renders a progress bar under the file list while an upload is in flight. */
  progress?: number;
};

/**
 * Reusable drag-and-drop file picker — the one upload UI every future
 * CMS module (banners, gallery, doctor photos, …) reuses instead of
 * hand-rolling its own. Purely presentational: it hands back the
 * selected `File[]`, the caller wires that into whatever upload
 * endpoint that module actually needs.
 */
export function FileUploadArea({
  files,
  onFilesChange,
  accept,
  multiple = false,
  disabled = false,
  hint,
  error,
  progress,
}: FileUploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = (incoming: File[]) => {
    if (incoming.length === 0) return;
    onFilesChange(multiple ? [...files, ...incoming] : incoming.slice(0, 1));
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled) addFiles(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-8 text-center transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          dragOver ? "border-primary bg-primary/5" : "border-input hover:border-primary/40 hover:bg-muted/40",
          error && "border-destructive/50",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <UploadCloud className="size-7 text-muted-foreground" aria-hidden="true" />
        <p className="text-body font-medium text-foreground">
          <span className="text-primary">Click to upload</span> or drag and drop
        </p>
        {hint && <p className="text-helper">{hint}</p>}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className="text-helper text-destructive">{error}</p>}

      {files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-2.5 rounded-md border border-border bg-card px-3 py-2"
            >
              <FilePreviewThumb file={file} />
              <span className="flex-1 truncate text-body-sm text-foreground">{file.name}</span>
              <span className="shrink-0 text-helper">{formatBytes(file.size)}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                disabled={disabled}
                aria-label={`Remove ${file.name}`}
                className="shrink-0 rounded-sm text-muted-foreground hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {progress !== undefined && progress < 100 && <Progress value={progress} />}
    </div>
  );
}
