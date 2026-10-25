import { cn } from "@/lib/utils";

export function AdminCard({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="admin-card"
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs",
        className
      )}
      {...props}
    />
  );
}
