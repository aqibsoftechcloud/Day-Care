import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type LoadingButtonProps = React.ComponentProps<typeof Button> & {
  loading?: boolean;
  loadingText?: string;
};

/**
 * Standard mutation-submit button: shows a spinner and swaps its label
 * while `loading`, and is disabled the entire time — the one reusable
 * way every CMS module prevents double-submission instead of each form
 * re-implementing its own spinner/disabled wiring.
 */
export function LoadingButton({
  loading = false,
  loadingText,
  children,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {loading && loadingText ? loadingText : children}
    </Button>
  );
}
