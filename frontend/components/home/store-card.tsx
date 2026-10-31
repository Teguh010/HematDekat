"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { FreshnessBadge } from "@/components/ui/freshness-badge";
import type { StoreSummary } from "@/lib/data/types";
import { formatRupiah, formatUnitPrice } from "@/lib/format";

type StoreCardProps = {
  store: StoreSummary;
  selectedProduct?: string;
  isHighlighted?: boolean;
  onHoverChange?: (storeId: string | null) => void;
};

export function StoreCard({
  store,
  selectedProduct,
  isHighlighted = false,
  onHoverChange,
}: StoreCardProps) {
  const t = useTranslations("home");
  const storeTypeT = useTranslations("storeType");

  const displayProduct = selectedProduct ? store.price?.productSlug === selectedProduct ? store.price : null : store.price;
  const productName = displayProduct?.productName ?? "-";
  const unitPrice = displayProduct?.normalizedUnitPrice ?? null;
  const packPrice = displayProduct?.price ?? null;
  const quantity = displayProduct?.quantity ?? null;
  const unitLabel = displayProduct?.unit ?? "kg";

  return (
    <Link
      href={`/stores/${store.slug}`}
      className={`block rounded-2xl border p-3 transition ${
        isHighlighted ? "border-emerald-400 bg-emerald-500/5" : "border-white/10 bg-slate-800"
      }`}
      onMouseEnter={() => onHoverChange?.(store.id)}
      onMouseLeave={() => onHoverChange?.(null)}
      onFocus={() => onHoverChange?.(store.id)}
      onBlur={() => onHoverChange?.(null)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-white">{store.name}</h3>
          <p className="mt-1 text-sm text-slate-400">
            {store.district ?? "-"}, {store.city.name}
          </p>
        </div>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-emerald-300">
          {storeTypeT(store.type)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-300">
        <span>{store.distanceKm !== null ? `${store.distanceKm.toFixed(1)} km` : "-"}</span>
        {store.hasActivePromo ? <span className="text-emerald-300">{t("promo")}</span> : <span>{t("standard")}</span>}
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/80 p-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{productName}</span>
          {displayProduct ? <FreshnessBadge updatedAt={displayProduct.verifiedAt} className="text-[8px]" /> : null}
        </div>

        {unitPrice !== null ? (
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <p className="text-base font-bold text-emerald-300">{formatUnitPrice(unitPrice, unitLabel)}</p>
              {packPrice !== null && quantity !== null ? (
                <p className="text-xs text-slate-400">
                  {formatRupiah(packPrice)} / {quantity} {unitLabel}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-400">{t("noPrice")}</p>
        )}
      </div>
    </Link>
  );
}
