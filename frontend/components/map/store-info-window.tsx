"use client";

import { InfoWindow } from "@vis.gl/react-google-maps";
import { useTranslations } from "next-intl";

import { VoteButton } from "@/components/vote-button";
import type { StoreSummary } from "@/lib/data/types";
import { formatRupiah } from "@/lib/format";

type StoreInfoWindowProps = {
  store: StoreSummary;
  onClose: () => void;
};

export function StoreInfoWindow({ store, onClose }: StoreInfoWindowProps) {
  const t = useTranslations("store");
  const price = store.price;

  return (
    <InfoWindow position={{ lat: store.lat, lng: store.lng }} onCloseClick={onClose}>
      <div className="min-w-[200px] rounded-xl bg-slate-950 p-2 text-slate-100">
        <p className="text-sm font-semibold text-white">{store.name}</p>
        <p className="mt-1 text-xs text-slate-400">
          {store.district ?? "-"}, {store.city.name}
        </p>
        {price ? (
          <>
            <p className="mt-2 text-sm font-semibold text-emerald-300">{formatRupiah(price.normalizedUnitPrice)}</p>
            <div className="mt-2 flex justify-end">
              <VoteButton priceReportId={price.priceReportId} count={price.confirmationCount} className="items-end" />
            </div>
          </>
        ) : (
          <p className="mt-2 text-xs text-slate-400">{t("noPriceRecorded")}</p>
        )}
      </div>
    </InfoWindow>
  );
}
