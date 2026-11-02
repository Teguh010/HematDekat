import type { ReactNode } from "react";

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
};

// The page's only <h1>, plus an optional description and action buttons.
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-ink-900">{title}</h1>
        {description ? <p className="mt-1 max-w-3xl text-sm text-ink-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
