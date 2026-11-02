import Link from "next/link";
import type { ReactNode } from "react";

type LinkCardProps = {
  href: string;
  children: ReactNode;
};

// A whole-card link with the standard hover and focus states.
export function LinkCard({ href, children }: LinkCardProps) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-ink-200 bg-surface p-3 transition-colors hover:border-brand-300 hover:bg-brand-50/40 focus-ring"
    >
      {children}
    </Link>
  );
}
