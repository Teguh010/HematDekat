import Link from "next/link";
import type { ReactNode } from "react";

const base = "inline-flex h-8 items-center rounded-full border px-3 text-sm font-medium transition-colors focus-ring";
const activeClass = "border-brand-600 bg-brand-600 text-on-brand";
const idleClass = "border-ink-300 bg-surface text-ink-700 hover:bg-ink-50";

type ChipProps = {
  active?: boolean;
  children: ReactNode;
} & ({ href: string; onClick?: never } | { href?: never; onClick: () => void });

// Pill used for filters and choices. With `href` it renders a link, with `onClick` a toggle button.
export function Chip({ active = false, children, href, onClick }: ChipProps) {
  const className = `${base} ${active ? activeClass : idleClass}`;

  if (href !== undefined) {
    return (
      <Link href={href} aria-current={active ? "true" : undefined} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={className}>
      {children}
    </button>
  );
}
