"use client";

import { createElement, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, HelpCircle, ImageOff, Loader2, Search, Trash2, Upload } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileUploadArea } from "@/components/admin/FileUploadArea";
import { cn } from "@/lib/utils";
import { getIconComponent, ICON_NAMES } from "@/lib/icon-registry";
import { ApiError } from "@/lib/api/client";
import { deleteHomepageCustomIcon, listHomepageCustomIcons, uploadHomepageCustomIcon } from "@/lib/api/homepage-custom-icons";
import { homepageCustomIconsKeys } from "@/components/admin/homepage-icons/queries";
import { notify } from "@/lib/toast";
import type { HomepageCustomIcon } from "@/types/homepage-custom-icon";
import type { HomepageIconValue } from "@/types/homepage-icon-settings";

// Always-valid component used ONLY as `getIconComponent`'s defensive
// fallback parameter here — the picker only ever offers names already in
// the registry, so this branch is unreachable in practice, but
// `getIconComponent` requires a fallback regardless of caller.
const ICON_REGISTRY_FALLBACK = HelpCircle;

/**
 * Renders via `createElement`, not a `<Tag />` JSX element, because the
 * component to render is chosen dynamically (one of ~90 registry
 * icons, by name) — `react-hooks/static-components` flags the
 * equivalent `const Icon = getIconComponent(...); return <Icon />` JSX
 * form as a potential "component created during render" even though
 * `getIconComponent` only ever returns a stable, pre-existing reference
 * from the static `ICON_REGISTRY` map, never creates anything new.
 * `createElement` is the same runtime operation JSX compiles down to;
 * this sidesteps the lint rule's JSX-specific heuristic without
 * changing what actually renders.
 */
function IconGlyph({ name, className }: { name: string; className?: string }) {
  const Icon = getIconComponent(name, ICON_REGISTRY_FALLBACK);
  return createElement(Icon, { className, "aria-hidden": "true" });
}

type IconPickerProps = {
  value: HomepageIconValue;
  onChange: (value: HomepageIconValue) => void;
  disabled?: boolean;
  id?: string;
};

/**
 * Two-tab searchable icon picker: "Icon Library" (the original, unchanged
 * searchable Lucide grid — the admin never types an icon name, they
 * search and click a real rendered preview) and "Custom Icons" (upload a
 * PNG/WebP/JPEG/SVG, or pick a previously uploaded one). The trigger
 * itself shows the currently selected icon — a Lucide glyph + name, or a
 * thumbnail + filename for a custom asset — so the current value is
 * visible without opening the popover.
 */
export function IconPicker({ value, onChange, disabled, id }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"library" | "custom">(value.type === "custom" ? "custom" : "library");

  // Shared across every IconPicker instance on the page (same query key),
  // so opening a second picker never re-fetches — TanStack Query dedupes
  // and caches by key regardless of how many components call this.
  const customIconsQuery = useQuery({ queryKey: homepageCustomIconsKeys.all, queryFn: listHomepageCustomIcons });
  const customIcons = customIconsQuery.data?.customIcons ?? [];
  const selectedCustomIcon = value.type === "custom" ? customIcons.find((icon) => icon.id === value.assetId) : undefined;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ICON_NAMES;
    return ICON_NAMES.filter((name) => name.toLowerCase().includes(q));
  }, [search]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setTab(value.type === "custom" ? "custom" : "library");
        } else {
          setSearch("");
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className="flex w-full items-center gap-2.5 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-foreground">
            {value.type === "lucide" ? (
              <IconGlyph name={value.name} className="size-4" />
            ) : selectedCustomIcon ? (
              // eslint-disable-next-line @next/next/no-img-element -- small fixed admin preview thumbnail, same convention GlobalTreatmentFormDialog's own image preview already uses.
              <img src={selectedCustomIcon.path} alt="" className="size-full object-contain p-0.5" />
            ) : (
              <ImageOff className="size-4" aria-hidden="true" />
            )}
          </span>
          <span className="flex-1 truncate text-left text-foreground">
            {value.type === "lucide" ? value.name : (selectedCustomIcon?.file_name ?? "Custom icon")}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <div className="grid grid-cols-2 border-b border-border">
          <button
            type="button"
            onClick={() => setTab("library")}
            className={cn(
              "px-3 py-2 text-sm font-medium transition-colors",
              tab === "library" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Icon Library
          </button>
          <button
            type="button"
            onClick={() => setTab("custom")}
            className={cn(
              "px-3 py-2 text-sm font-medium transition-colors",
              tab === "custom" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Custom Icons
          </button>
        </div>

        {tab === "library" ? (
          <>
            <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
              <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <Input
                autoFocus
                placeholder="Search icons…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-7 border-0 p-0 shadow-none focus-visible:ring-0"
              />
            </div>

            <div className="grid max-h-72 grid-cols-6 gap-1 overflow-y-auto p-2.5">
              {filtered.length === 0 ? (
                <p className="col-span-6 py-6 text-center text-body-sm text-muted-foreground">No icons found.</p>
              ) : (
                filtered.map((name) => {
                  const isSelected = value.type === "lucide" && name === value.name;
                  return (
                    <button
                      key={name}
                      type="button"
                      title={name}
                      onClick={() => {
                        onChange({ type: "lucide", name });
                        setOpen(false);
                        setSearch("");
                      }}
                      className={cn(
                        "relative flex aspect-square items-center justify-center rounded-md border transition-colors hover:border-ring hover:bg-muted",
                        isSelected ? "border-primary bg-primary/8 text-primary" : "border-transparent text-foreground"
                      )}
                    >
                      <IconGlyph name={name} className="size-4.5" />
                      {isSelected && <Check className="absolute right-0.5 top-0.5 size-3 text-primary" aria-hidden="true" />}
                    </button>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <CustomIconsTab
            value={value}
            customIcons={customIcons}
            loading={customIconsQuery.isLoading}
            onSelect={(assetId) => {
              onChange({ type: "custom", assetId });
              setOpen(false);
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

const MAX_ICON_FILE_SIZE_LABEL = "1MB";

function CustomIconsTab({
  value,
  customIcons,
  loading,
  onSelect,
}: {
  value: HomepageIconValue;
  customIcons: HomepageCustomIcon[];
  loading: boolean;
  onSelect: (assetId: number) => void;
}) {
  const queryClient = useQueryClient();
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | undefined>(undefined);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadHomepageCustomIcon(file, setUploadProgress),
    onSuccess: (data) => {
      notify.success("Icon uploaded.");
      queryClient.invalidateQueries({ queryKey: homepageCustomIconsKeys.all });
      setStagedFiles([]);
      setUploadProgress(0);
      setUploadError(undefined);
      onSelect(data.customIcon.id);
    },
    onError: (error) => {
      setUploadProgress(0);
      setUploadError(error instanceof ApiError ? error.message : "Upload failed. Please try again.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteHomepageCustomIcon(id),
    onSuccess: () => {
      notify.success("Custom icon deleted.");
      queryClient.invalidateQueries({ queryKey: homepageCustomIconsKeys.all });
    },
    onError: (error) => notify.apiError(error, "Failed to delete this icon — it may still be in use."),
  });

  return (
    <div className="flex flex-col gap-3 p-3">
      <FileUploadArea
        files={stagedFiles}
        onFilesChange={(files) => {
          setStagedFiles(files);
          setUploadError(undefined);
        }}
        accept="image/svg+xml,image/png,image/webp,image/jpeg"
        hint={`SVG, PNG, WebP, or JPEG — up to ${MAX_ICON_FILE_SIZE_LABEL}, transparent backgrounds supported`}
        disabled={uploadMutation.isPending}
        error={uploadError}
        progress={uploadMutation.isPending ? uploadProgress : undefined}
      />

      {stagedFiles.length > 0 && !uploadMutation.isPending && (
        <Button type="button" size="sm" className="w-fit" onClick={() => uploadMutation.mutate(stagedFiles[0])}>
          <Upload className="size-4" aria-hidden="true" />
          Upload &amp; Use This Icon
        </Button>
      )}

      <div className="max-h-56 overflow-y-auto border-t border-border pt-3">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Loading…
          </div>
        ) : customIcons.length === 0 ? (
          <p className="py-6 text-center text-body-sm text-muted-foreground">No custom icons uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {customIcons.map((icon) => {
              const isSelected = value.type === "custom" && value.assetId === icon.id;
              return (
                <div key={icon.id} className="group relative flex flex-col gap-1">
                  <button
                    type="button"
                    title={icon.file_name}
                    onClick={() => onSelect(icon.id)}
                    className={cn(
                      "relative flex aspect-square items-center justify-center overflow-hidden rounded-md border transition-colors hover:border-ring hover:bg-muted",
                      isSelected ? "border-primary bg-primary/8" : "border-border"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- small fixed admin grid thumbnail, same convention as the trigger's own preview above. */}
                    <img src={icon.path} alt="" className="size-full object-contain p-1.5" />
                    {isSelected && <Check className="absolute right-0.5 top-0.5 size-3 text-primary" aria-hidden="true" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(icon.id)}
                    disabled={deleteMutation.isPending}
                    aria-label={`Delete ${icon.file_name}`}
                    className="absolute -right-1 -top-1 flex size-4.5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-50"
                  >
                    <Trash2 className="size-2.5" aria-hidden="true" />
                  </button>
                  <p className="truncate text-[10px] text-muted-foreground" title={icon.file_name}>
                    {icon.file_name}
                    {icon.width && icon.height ? ` · ${icon.width}×${icon.height}` : ""}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
