import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type FormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** The form body — typically a `<form>` ending in a `<DialogFooter>` with Cancel/Save actions (see LoadingButton for the submit button). */
  children: ReactNode;
  className?: string;
  /** Shows the Expand/Collapse control beside Close. Defaults to true since forms are the case that benefits most from the extra room. */
  expandable?: boolean;
};

/**
 * Shared chrome for every create/edit dialog in the CMS (Roles, Users,
 * Doctors, Blogs, …) — title + optional description + body. Keeps every
 * module's "add/edit X" dialog visually identical without each module
 * hand-rolling its own Dialog/DialogHeader wiring or, worse, its own
 * bespoke modal component (e.g. a "DoctorModal").
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  expandable = true,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-lg", className)} expandable={expandable}>
        <DialogHeader className={expandable ? "pr-16" : "pr-8"}>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
