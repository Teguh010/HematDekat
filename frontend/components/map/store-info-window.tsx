"use client";

import { InfoWindow } from "@vis.gl/react-google-maps";

import type { StoreSummary } from "@/lib/data/types";
import { formatRupiah } from "@/lib/format";

type StoreInfoWindowProps = {
  store: StoreSummary;
  onClose: () => void;
};

export function StoreInfoWindow({ store, onClose }: StoreInfoWindowProps) {
  const price = store.price?.normalizedUnitPrice ?? 0;

  return (
    <InfoWindow position={{ lat: store.lat, lng: store.lng }} onCloseClick={onClose}>
      <div className="min-w-[180px] rounded-xl bg-slate-950 p-2 text-slate-100">
        <p className="text-sm font-semibold text-white">{store.name}</p>
        <p className="mt-1 text-xs text-slate-400">
          {store.district ?? "-"}, {store.city.name}
        </p>
        <p className="mt-2 text-sm font-semibold text-emerald-300">{formatRupiah(price)}</p>
      </div>
    </InfoWindow>
  );
}
