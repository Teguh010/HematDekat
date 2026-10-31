"use client";

import { APIProvider, AdvancedMarker, Map } from "@vis.gl/react-google-maps";
import { useTranslations } from "next-intl";

import type { Store } from "@/lib/data/repository";
import { formatRupiah } from "@/lib/format";

type StoreMapProps = {
  stores: Store[];
  apiKey: string;
  defaultCenter?: { lat: number; lng: number };
  defaultZoom?: number;
};

export function StoreMap({
  stores,
  apiKey,
  defaultCenter = { lat: -6.9, lng: 107.7 },
  defaultZoom = 6,
}: StoreMapProps) {
  const t = useTranslations("map");

  if (!apiKey) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-800 text-sm text-slate-300">
        {t("apiKeyMissing")}
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={defaultCenter}
        defaultZoom={defaultZoom}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapId="sembako-map"
        style={{ width: "100%", height: "100%" }}
      >
        {stores.map((store) => {
          const lowestMarkerPrice = store.products.length > 0 ? Math.min(...store.products.map((item) => item.price)) : 0;

          return (
            <AdvancedMarker
              key={store.id}
              position={{ lat: store.coordinates.lat, lng: store.coordinates.lng }}
              title={store.name}
            >
              <div className="flex -translate-y-3 items-center justify-center">
                <div className="rounded-full border border-emerald-300 bg-emerald-500 px-2 py-1 text-[10px] font-bold text-white shadow-lg shadow-emerald-500/50">
                  {formatRupiah(lowestMarkerPrice)}
                </div>
                <div className="ml-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-400 shadow-md shadow-emerald-500/60" />
              </div>
            </AdvancedMarker>
          );
        })}
      </Map>
    </APIProvider>
  );
}
