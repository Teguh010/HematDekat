"use client";

import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";

import type { StoreSummary } from "@/lib/data/types";
import { ClusteredPins } from "./clustered-pins";
import { StoreInfoWindow } from "./store-info-window";

type StoreMapProps = {
  stores: StoreSummary[];
  apiKey: string;
  defaultCenter?: { lat: number; lng: number };
  defaultZoom?: number;
  hoveredStoreId?: string | null;
  selectedStoreId?: string | null;
  onSelectStore?: (storeId: string | null) => void;
  onHoverStore?: (storeId: string | null) => void;
};

function MapView({
  stores,
  defaultCenter,
  defaultZoom,
  hoveredStoreId = null,
  selectedStoreId = null,
  onSelectStore,
  onHoverStore,
}: Omit<StoreMapProps, "apiKey">) {
  const map = useMap();
  const selectedStore = useMemo(
    () => stores.find((store) => store.id === selectedStoreId) ?? null,
    [selectedStoreId, stores],
  );

  useEffect(() => {
    if (!map) return;

    if (selectedStore) {
      map.panTo({ lat: selectedStore.lat, lng: selectedStore.lng });
      map.setZoom(Math.max(map.getZoom() || defaultZoom || 12, 12));
      return;
    }

    map.setCenter(defaultCenter ?? { lat: -2.5, lng: 118 });
    map.setZoom(defaultZoom ?? 5);
  }, [defaultCenter, defaultZoom, map, selectedStore]);

  return (
    <>
      <ClusteredPins
        stores={stores}
        hoveredStoreId={hoveredStoreId}
        selectedStoreId={selectedStoreId}
        onHover={(storeId) => onHoverStore?.(storeId)}
        onSelect={(storeId) => {
          onSelectStore?.(storeId);
          onHoverStore?.(storeId);
        }}
      />
      {selectedStore ? (
        <StoreInfoWindow store={selectedStore} onClose={() => onSelectStore?.(null)} />
      ) : null}
    </>
  );
}

export function StoreMap({
  stores,
  apiKey,
  defaultCenter = { lat: -2.5, lng: 118 },
  defaultZoom = 5,
  hoveredStoreId = null,
  selectedStoreId = null,
  onSelectStore,
  onHoverStore,
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
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "DEMO_MAP_ID"}
        style={{ width: "100%", height: "100%" }}
      >
        <MapView
          stores={stores}
          defaultCenter={defaultCenter}
          defaultZoom={defaultZoom}
          hoveredStoreId={hoveredStoreId}
          selectedStoreId={selectedStoreId}
          onSelectStore={onSelectStore}
          onHoverStore={onHoverStore}
        />
      </Map>
    </APIProvider>
  );
}
