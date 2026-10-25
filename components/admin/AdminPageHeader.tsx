import type { ReactNode } from "react";

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="text-page-title text-foreground">{children}</h1>;
}

export function PageDescription({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-body text-muted-foreground">{children}</p>;
}

/** Standard page-level header: title + description on the left, primary action on the right. */
export function AdminPageHeader({
  title,
  description,
  action,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <PageTitle>{title}</PageTitle>
        {description && <PageDescription>{description}</PageDescription>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
