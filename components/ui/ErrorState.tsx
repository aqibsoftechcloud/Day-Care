import { AlertCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ title = "Something went wrong", message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-6 py-20 text-center">
      <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="size-5" aria-hidden="true" />
      </span>
      <p className="text-subtitle text-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-body-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
          <RotateCw className="size-3.5" aria-hidden="true" />
          Try again
        </Button>
      )}
    </div>
  );
}
