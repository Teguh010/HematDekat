"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { FreshnessBadge } from "@/components/ui/freshness-badge";
import type { StoreSummary } from "@/lib/data/types";
import { formatUnitPrice } from "@/lib/format";

type StoreCardProps = {
  store: StoreSummary;
  selectedProduct?: string;
  isHighlighted?: boolean;
  onHoverChange?: (storeId: string | null) => void;
  onSelect?: (storeId: string) => void;
};

export function StoreCard({
  store,
  selectedProduct,
  isHighlighted = false,
  onHoverChange,
  onSelect,
}: StoreCardProps) {
  const t = useTranslations("home");
  const storeTypeT = useTranslations("storeType");

  const displayProduct = selectedProduct ? store.price?.productSlug === selectedProduct ? store.price : null : store.price;
  const unitPrice = displayProduct?.normalizedUnitPrice ?? null;
  const unitLabel = displayProduct?.unit ?? "kg";
  const meta = [
    storeTypeT(store.type),
    [store.district, store.city.name].filter(Boolean).join(", "),
    store.distanceKm !== null ? `${store.distanceKm.toFixed(1)} km` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/stores/${store.slug}`}
      data-store-id={store.id}
      className={`block border-b border-ink-100 px-3 py-2 transition-colors hover:bg-ink-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600 ${
        isHighlighted ? "bg-brand-50" : "bg-surface"
      }`}
      onMouseEnter={() => onHoverChange?.(store.id)}
      onMouseLeave={() => onHoverChange?.(null)}
      onFocus={() => onHoverChange?.(store.id)}
      onBlur={() => onHoverChange?.(null)}
      onClick={() => onSelect?.(store.id)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate text-sm font-medium text-ink-900">{store.name}</h3>
          {store.hasActivePromo ? <Badge variant="warning">{t("promo")}</Badge> : null}
        </div>
        {unitPrice !== null ? (
          <span className="shrink-0 text-sm font-semibold text-brand-700">{formatUnitPrice(unitPrice, unitLabel)}</span>
        ) : (
          <span className="shrink-0 text-xs text-ink-500">{t("noPrice")}</span>
        )}
      </div>

      <div className="mt-0.5 flex items-center justify-between gap-3 text-xs text-ink-500">
        <span className="truncate">{meta}</span>
        {displayProduct ? <FreshnessBadge updatedAt={displayProduct.verifiedAt} className="shrink-0" /> : null}
      </div>
    </Link>
  );
}
