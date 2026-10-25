"use client";

import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type TableActionButtonProps = {
  icon: LucideIcon;
  /** Short tooltip text, e.g. "View". */
  label: string;
  /** Full accessible label, e.g. "View role". */
  ariaLabel: string;
  onClick: () => void;
  variant?: "default" | "destructive";
};

/**
 * One compact, icon-only row action with a tooltip — the shared pattern
 * for showing table actions directly in the row instead of behind a "…"
 * dropdown. Reused across every action (View/Edit/Delete/…) so hover,
 * focus, sizing, and spacing stay identical everywhere.
 */
export function TableActionButton({ icon: Icon, label, ariaLabel, onClick, variant = "default" }: TableActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClick}
          aria-label={ariaLabel}
          className={cn(
            "text-muted-foreground hover:bg-muted hover:text-foreground",
            variant === "destructive" && "hover:bg-destructive/10 hover:text-destructive"
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}
