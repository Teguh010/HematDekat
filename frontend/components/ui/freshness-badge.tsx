"use client";

import { useTranslations } from "next-intl";

import { daysSince, freshnessLevel } from "@/lib/format";

type FreshnessBadgeProps = {
  updatedAt: string;
  className?: string;
};

export function FreshnessBadge({ updatedAt, className = "" }: FreshnessBadgeProps) {
  const t = useTranslations("freshness");
  const level = freshnessLevel(updatedAt);
  const days = daysSince(updatedAt);

  const variantClasses = {
    fresh: "bg-brand-50 text-brand-700",
    recent: "bg-warn-50 text-warn-700",
    stale: "bg-ink-100 text-ink-600",
  } as const;

  const label =
    level === "fresh"
      ? t("fresh")
      : level === "recent"
        ? t("recent", { days })
        : t("stale");

  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${variantClasses[level]} ${className}`}>{label}</span>;
}
