"use client";

import { Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DeleteConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  loading?: boolean;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Generic destructive-action confirmation dialog, built on shadcn's
 * AlertDialog. Every DELETE (and any other irreversible action) in the
 * admin should route through this rather than `window.confirm()`.
 */
export function DeleteConfirmDialog({
  open,
  title,
  description,
  loading = false,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && !loading && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2 aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} onClick={onCancel}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={loading}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {loading ? "Deleting…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
