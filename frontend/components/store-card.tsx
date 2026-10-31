"use client";

import { useTranslations } from "next-intl";

import type { StoreSummary } from "@/lib/data/types";
import { formatRupiah } from "@/lib/format";

type StoreCardProps = {
  store: StoreSummary;
};

export function StoreCard({ store }: StoreCardProps) {
  const t = useTranslations("home");
  const lowestProductName = store.price?.productName ?? "-";
  const lowestPrice = store.price?.normalizedUnitPrice ?? 0;

  return (
    <article key={store.id} className="rounded-2xl border border-white/10 bg-slate-800 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">{store.name}</h3>
          <p className="mt-1 text-sm text-slate-400">
            {store.district ?? "-"}, {store.city.name}
          </p>
        </div>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-emerald-300">
          {store.type}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-slate-300">
        <span>{t("distance", { distance: store.distanceKm ?? 0 })}</span>
        <span>{store.hasActivePromo ? t("promo") : t("standard")}</span>
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/80 p-2">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t("cheapestNow")}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-medium text-slate-200">{lowestProductName}</span>
          <span className="text-base font-bold text-emerald-300">{formatRupiah(lowestPrice)}</span>
        </div>
      </div>
    </article>
  );
}
