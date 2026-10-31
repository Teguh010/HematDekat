"use client";

import type { StoreSummary } from "@/lib/data/types";
import { formatRupiah } from "@/lib/format";

type PricePinProps = {
  store: StoreSummary;
  hovered?: boolean;
  selected?: boolean;
};

export function PricePin({ store, hovered = false, selected = false }: PricePinProps) {
  const price = store.price?.normalizedUnitPrice ?? 0;
  const isActive = hovered || selected;

  return (
    <div className="flex -translate-y-3 items-center justify-center">
      <div
        className={`rounded-full border px-2 py-1 text-[10px] font-bold text-white shadow-lg ${
          isActive
            ? "border-emerald-200 bg-emerald-500 shadow-emerald-500/40"
            : "border-emerald-300 bg-emerald-500/90 shadow-emerald-500/30"
        }`}
      >
        {formatRupiah(price)}
      </div>
      <div
        className={`ml-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white shadow-md ${
          isActive ? "bg-emerald-400 shadow-emerald-500/60" : "bg-emerald-300 shadow-emerald-500/40"
        }`}
      />
    </div>
  );
}
