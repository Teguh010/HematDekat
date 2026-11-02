import type { ReactNode } from "react";

import { Card } from "./card";

type SectionProps = {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

// A Card with an <h2> title and an optional right-aligned action.
export function Section({ title, action, className = "", children }: SectionProps) {
  return (
    <Card as="section" className={className}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink-900">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  );
}
