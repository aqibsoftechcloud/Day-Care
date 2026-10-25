import { format } from "date-fns";

/**
 * The one CMS-wide date display convention — every module renders
 * created/updated/published dates through this instead of picking its
 * own date-fns pattern per page.
 */
export function formatDate(value: string | Date, pattern = "MMM d, yyyy"): string {
  try {
    return format(value, pattern);
  } catch {
    return typeof value === "string" ? value : "";
  }
}

/** Same convention, with a time component — for audit/activity-style timestamps. */
export function formatDateTime(value: string | Date): string {
  return formatDate(value, "MMM d, yyyy 'at' h:mm a");
}
