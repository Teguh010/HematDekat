"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PendingItem } from "@/lib/data/types";
import { formatRupiah, formatUnitPrice } from "@/lib/format";

type PendingItemCardProps = {
  item: PendingItem;
  isSubmitting: boolean;
  onApprove: () => void;
  onReject: () => void;
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PendingItemCard({ item, isSubmitting, onApprove, onReject }: PendingItemCardProps) {
  const t = useTranslations("admin");
  const unitLabel = item.product.defaultUnit;

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between ${
        item.flagged ? "border-danger-200 bg-danger-50" : "border-ink-200 bg-surface"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {item.flagged ? <Badge variant="danger">{t("flagged")}</Badge> : null}
          <Link href={`/stores/${item.store.slug}`} className="text-sm font-semibold text-ink-900 hover:text-brand-700">
            {item.store.name}
          </Link>
          <span className="text-sm text-ink-500">{item.product.name}</span>
        </div>

        {item.flagged && item.flagReason ? <p className="mt-1 text-xs text-danger-700">{item.flagReason}</p> : null}

        <div className="mt-1 text-sm text-ink-700">
          {item.kind === "price-report" ? (
            <p>
              {item.normalizedUnitPrice !== null ? formatUnitPrice(item.normalizedUnitPrice, unitLabel) : "-"}
              {item.price !== null && item.quantity !== null ? (
                <span className="text-ink-500">
                  {" "}
                  &middot; {formatRupiah(item.price)} / {item.quantity} {unitLabel}
                </span>
              ) : null}
            </p>
          ) : (
            <p>
              {item.promoPrice !== null
                ? formatRupiah(item.promoPrice)
                : item.discountPct !== null
                  ? t("discount", { pct: item.discountPct })
                  : "-"}
              {item.validFrom && item.validTo ? (
                <span className="text-ink-500">
                  {" "}
                  &middot; {t("validRange", { from: formatDateTime(item.validFrom), to: formatDateTime(item.validTo) })}
                </span>
              ) : null}
            </p>
          )}
        </div>

        <p className="mt-1 text-xs text-ink-500">
          {item.submittedBy} &middot; {t("submittedAt", { date: formatDateTime(item.createdAt) })}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button type="button" size="sm" onClick={onApprove} disabled={isSubmitting}>
          {t("approve")}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onReject} disabled={isSubmitting}>
          {t("reject")}
        </Button>
      </div>
    </div>
  );
}
