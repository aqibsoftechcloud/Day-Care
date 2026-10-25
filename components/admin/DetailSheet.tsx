import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export type DetailRow = { label: string; value: ReactNode };
export type DetailSection = { heading: string; rows: DetailRow[] };

type DetailSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  sections: DetailSection[];
};

/**
 * One reusable read-only detail sheet shared by every CMS module's "View"
 * action (leads, cities, locations, …) — each caller supplies its own
 * section/field data, this owns the shell, spacing, and scrolling so
 * every module's detail view looks identical.
 */
export function DetailSheet({ open, onClose, title, description, sections }: DetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-5">
            {sections.map((section) => (
              <section key={section.heading} className="flex flex-col gap-2">
                <h3 className="text-label text-foreground">{section.heading}</h3>
                <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
                  {section.rows.map((row) => (
                    <div key={row.label} className="grid grid-cols-[120px_1fr] gap-3">
                      <dt className="text-caption">{row.label}</dt>
                      <dd className="min-w-0 text-body-sm break-words text-foreground">{row.value}</dd>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <SheetFooter className="border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
