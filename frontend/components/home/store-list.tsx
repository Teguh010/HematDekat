"use client";

import { useTranslations } from "next-intl";

import { StoreCard } from "@/components/store-card";
import type { StoreSummary } from "@/lib/data/types";

type StoreListProps = {
  stores: StoreSummary[];
};

export function StoreList({ stores }: StoreListProps) {
  const t = useTranslations("home");

  if (stores.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/60 p-6 text-center text-sm text-slate-300">
        {t("emptyStores")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {stores.map((store) => (
        <StoreCard key={store.id} store={store} />
      ))}
    </div>
  );
}
