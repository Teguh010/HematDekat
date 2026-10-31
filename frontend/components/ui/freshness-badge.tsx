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
    fresh: "border border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
    recent: "border border-amber-500/30 bg-amber-500/10 text-amber-200",
    stale: "border border-slate-700 bg-slate-700 text-slate-300",
  } as const;

  const label =
    level === "fresh"
      ? t("fresh")
      : level === "recent"
        ? t("recent", { days })
        : t("stale");

  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] ${variantClasses[level]} ${className}`}>{label}</span>;
}
