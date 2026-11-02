"use client";

import { InfoWindow } from "@vis.gl/react-google-maps";
import { useTranslations } from "next-intl";

import { VoteButton } from "@/components/vote-button";
import { Button } from "@/components/ui/button";
import { FreshnessBadge } from "@/components/ui/freshness-badge";
import type { StoreSummary } from "@/lib/data/types";
import { formatUnitPrice } from "@/lib/format";

type StoreInfoWindowProps = {
  store: StoreSummary;
  onClose: () => void;
};

export function StoreInfoWindow({ store, onClose }: StoreInfoWindowProps) {
  const t = useTranslations();
  const price = store.price;

  return (
    <InfoWindow position={{ lat: store.lat, lng: store.lng }} onCloseClick={onClose}>
      <div className="min-w-[200px] space-y-1 text-slate-900">
        <p className="text-sm font-semibold text-slate-900">{store.name}</p>
        <p className="text-xs text-slate-500">
          {store.district ?? "-"}, {store.city.name}
        </p>
        {price ? (
          <>
            <div className="flex items-center justify-between gap-2 pt-1">
              <p className="text-sm font-semibold text-emerald-700">{formatUnitPrice(price.normalizedUnitPrice, price.unit)}</p>
              <FreshnessBadge updatedAt={price.verifiedAt} />
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              <VoteButton priceReportId={price.priceReportId} count={price.confirmationCount} />
              <Button href={`/stores/${store.slug}`} size="sm">
                {t("map.viewStore")}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-slate-500">{t("store.noPriceRecorded")}</p>
            <div className="flex justify-end pt-1">
              <Button href={`/stores/${store.slug}`} size="sm">
                {t("map.viewStore")}
              </Button>
            </div>
          </>
        )}
      </div>
    </InfoWindow>
  );
}
