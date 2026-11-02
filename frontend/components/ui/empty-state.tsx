import type { ReactNode } from "react";

type EmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-ink-200 bg-surface p-4 text-center">
      <p className="text-base font-semibold text-ink-900">{title}</p>
      {description ? <p className="mt-1 text-sm text-ink-500">{description}</p> : null}
      {action ? <div className="mt-3 flex justify-center">{action}</div> : null}
    </div>
  );
}
