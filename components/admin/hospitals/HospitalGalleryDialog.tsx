"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ImageIcon, Loader2, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/admin/FormDialog";
import { LoadingButton } from "@/components/admin/LoadingButton";
import { FileUploadArea } from "@/components/admin/FileUploadArea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Field, FieldLabel } from "@/components/ui/field";
import { ApiError } from "@/lib/api/client";
import { createGalleryItem, deleteGalleryItem, listGallery, updateGalleryItem } from "@/lib/api/gallery";
import { notify } from "@/lib/toast";
import type { Gallery } from "@/types/gallery";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const IMAGE_HINT = "JPG, PNG, WEBP or GIF, up to 5MB";

const galleryKeyForHospital = (hospitalId: number) => ["gallery", "hospital", hospitalId] as const;

type HospitalGalleryDialogProps = {
  open: boolean;
  hospitalId: number | null;
  hospitalName?: string;
  onOpenChange: (open: boolean) => void;
};

/**
 * Hospital-scoped gallery management: lists every `gallery` row with
 * `hospital_id` set to this hospital (any status, so an admin can
 * reactivate one), lets them add a new image (real upload via the
 * existing storage abstraction — see services/gallery.service.ts),
 * reorder, activate/deactivate, or permanently delete. The public
 * Hospital Gallery section only ever reads the active subset.
 */
export function HospitalGalleryDialog({ open, hospitalId, hospitalName, onOpenChange }: HospitalGalleryDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Manage Gallery"
      description={hospitalName ? `Hospital: ${hospitalName}` : undefined}
      className="sm:max-w-2xl"
    >
      {open && hospitalId !== null && <HospitalGalleryBody hospitalId={hospitalId} />}
    </FormDialog>
  );
}

function HospitalGalleryBody({ hospitalId }: { hospitalId: number }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const galleryQuery = useQuery({
    queryKey: galleryKeyForHospital(hospitalId),
    queryFn: () => listGallery({ hospital_id: hospitalId }),
  });
  const items = (galleryQuery.data?.gallery ?? []).slice().sort((a, b) => a.sorting_order - b.sorting_order);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: galleryKeyForHospital(hospitalId) });

  const addMutation = useMutation({
    // `uniqueSuffix` is generated at the click-site (an event handler,
    // not render), never here — a `Date.now()`/similar impure call
    // written directly inside render-reachable code trips React
    // Compiler's purity check even though this closure only actually
    // executes on-demand.
    mutationFn: (uniqueSuffix: string) => {
      const nextOrder = items.length > 0 ? Math.max(...items.map((i) => i.sorting_order)) + 1 : 0;
      return createGalleryItem(
        {
          hospital_id: hospitalId,
          gallery_name: name.trim(),
          gallery_type: "image",
          seo_url: `hospital-${hospitalId}-gallery-${uniqueSuffix}`,
          sorting_order: nextOrder,
        },
        files[0]
      );
    },
    onSuccess: () => {
      notify.success("Image added to gallery.");
      setName("");
      setFiles([]);
      invalidate();
    },
    onError: (error) => notify.apiError(error),
  });

  const statusMutation = useMutation({
    mutationFn: ({ item, active }: { item: Gallery; active: boolean }) =>
      updateGalleryItem(item.id, { gallery_status: active ? "active" : "inactive" }),
    onSuccess: invalidate,
    onError: (error) => notify.apiError(error),
  });

  const reorderMutation = useMutation({
    mutationFn: ({ item, sorting_order }: { item: Gallery; sorting_order: number }) =>
      updateGalleryItem(item.id, { sorting_order }),
    onSuccess: invalidate,
    onError: (error) => notify.apiError(error),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteGalleryItem(id),
    onSuccess: () => {
      notify.success("Image deactivated.");
      invalidate();
    },
    onError: (error) => notify.apiError(error),
  });

  function moveItem(index: number, direction: -1 | 1) {
    const target = items[index + direction];
    const current = items[index];
    if (!target || !current) return;
    reorderMutation.mutate({ item: current, sorting_order: target.sorting_order });
    reorderMutation.mutate({ item: target, sorting_order: current.sorting_order });
  }

  if (galleryQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading gallery…
      </div>
    );
  }

  if (galleryQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {galleryQuery.error instanceof ApiError ? galleryQuery.error.message : "Failed to load the gallery."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        {items.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">No images added yet.</p>
        ) : (
          items.map((item, index) => (
            <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-3">
              {item.source ? (
                // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail only.
                <img src={item.source} alt="" className="size-12 shrink-0 rounded-md border border-border object-cover" />
              ) : (
                <span className="flex size-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                  <ImageIcon className="size-5" aria-hidden="true" />
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-body-sm font-medium text-foreground">{item.gallery_name}</span>
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon-sm" disabled={index === 0} onClick={() => moveItem(index, -1)} aria-label="Move up">
                  <ChevronUp className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={index === items.length - 1}
                  onClick={() => moveItem(index, 1)}
                  aria-label="Move down"
                >
                  <ChevronDown className="size-4" aria-hidden="true" />
                </Button>
                <Switch
                  checked={item.gallery_status === "active"}
                  onCheckedChange={(checked) => statusMutation.mutate({ item, active: checked })}
                  aria-label={item.gallery_status === "active" ? "Deactivate image" : "Activate image"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => deleteMutation.mutate(item.id)}
                  aria-label="Delete image"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-4">
        <FieldLabel>Add Image</FieldLabel>
        <Field>
          <Input placeholder="Image name" value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <FileUploadArea files={files} onFilesChange={setFiles} accept={IMAGE_ACCEPT} hint={IMAGE_HINT} disabled={addMutation.isPending} />
        <LoadingButton
          type="button"
          size="sm"
          className="w-fit"
          loading={addMutation.isPending}
          disabled={!name.trim() || files.length === 0}
          onClick={() => addMutation.mutate(String(Date.now()))}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add Image
        </LoadingButton>
      </div>
    </div>
  );
}
