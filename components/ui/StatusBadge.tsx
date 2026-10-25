import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "danger" | "info" | "muted";

/**
 * Lowercased status string → semantic tone. Every CMS module funnels
 * whatever status vocabulary its backend actually uses through this one
 * map — nothing here invents new statuses, it only assigns an existing
 * status string a consistent color.
 */
const STATUS_TONE_MAP: Record<string, StatusTone> = {
  active: "success",
  published: "success",
  approved: "success",
  success: "success",
  completed: "success",
  enabled: "success",
  pending: "warning",
  draft: "warning",
  review: "warning",
  inactive: "muted",
  disabled: "muted",
  archived: "muted",
  hidden: "muted",
  rejected: "danger",
  failed: "danger",
  cancelled: "danger",
  blocked: "danger",
};

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "text-success bg-success/10",
  warning: "text-warning bg-warning/10",
  danger: "text-destructive bg-destructive/10",
  info: "text-info bg-info/10",
  muted: "text-muted-foreground bg-muted",
};

const DOT_CLASSES: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  info: "bg-info",
  muted: "bg-muted-foreground/50",
};

function toTitleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

type StatusBadgeProps = {
  /** The raw backend status string (e.g. "active", "draft", "failed"). */
  status: string;
  /** Explicit tone override, for statuses this map doesn't already recognize. */
  tone?: StatusTone;
  /** Label override — defaults to the status string, title-cased. */
  label?: string;
};

/** Centralized status pill — every module (roles, users, pages, blogs, …) renders its status through this one component instead of hand-rolling colors. */
export function StatusBadge({ status, tone, label }: StatusBadgeProps) {
  const resolvedTone = tone ?? STATUS_TONE_MAP[status.toLowerCase()] ?? "muted";

  return (
    <span
      className={cn(
        "inline-flex h-5.5 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium",
        TONE_CLASSES[resolvedTone]
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOT_CLASSES[resolvedTone])} aria-hidden="true" />
      {label ?? toTitleCase(status)}
    </span>
  );
}
