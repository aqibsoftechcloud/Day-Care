import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";

/**
 * Thin, consistent wrapper around Sonner. Keeps toast copy/behavior
 * uniform across every CMS module rather than each page calling `toast()`
 * directly with ad-hoc options.
 */
export const notify = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  warning: (message: string) => toast.warning(message),
  /** Extracts a safe, user-facing message from an API failure — never a raw stack trace. */
  apiError: (error: unknown, fallback = "Something went wrong. Please try again.") =>
    toast.error(error instanceof ApiError ? error.message : fallback),
};
