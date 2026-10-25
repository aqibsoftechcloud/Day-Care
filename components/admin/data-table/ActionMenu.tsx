"use client";

import { Fragment } from "react";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ActionMenuItem = {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  variant?: "default" | "destructive";
};

/** Consistent row-actions trigger for DataTable rows — a single kebab button that opens a DropdownMenu. */
export function ActionMenu({
  items,
  label = "Open actions menu",
}: {
  items: ActionMenuItem[];
  label?: string;
}) {
  if (items.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          className="rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {items.map((item, index) => (
          <Fragment key={item.label}>
            {item.variant === "destructive" && index > 0 && (
              <div className="my-1 h-px bg-border" />
            )}
            <DropdownMenuItem variant={item.variant} onSelect={item.onSelect}>
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
            </DropdownMenuItem>
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
