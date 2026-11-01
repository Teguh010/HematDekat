"use client";

import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { StoreSummary } from "@/lib/data/types";
import { buildSearchParams, parseSearchParams } from "@/lib/search-params";
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const parsedParams = useMemo(() => parseSearchParams(Object.fromEntries(searchParams.entries())), [searchParams]);
  const programmaticUpdateRef = useRef(false);
  const [showAreaSearch, setShowAreaSearch] = useState(false);
  const selectedStore = useMemo(
    () => stores.find((store) => store.id === selectedStoreId) ?? null,
    [selectedStoreId, stores],
  );
  const t = useTranslations("map");

  useEffect(() => {
    if (!map) return;

    const handleInteraction = () => {
      if (programmaticUpdateRef.current) {
        programmaticUpdateRef.current = false;
        return;
      }

      setShowAreaSearch(true);
    };

    const listeners = [
      map.addListener("dragend", handleInteraction),
      map.addListener("zoom_changed", handleInteraction),
    ];

    return () => {
      listeners.forEach((listener) => listener.remove());
    };
  }, [map]);

  useEffect(() => {
    if (!map) return;

    programmaticUpdateRef.current = true;

    if (selectedStore) {
      map.panTo({ lat: selectedStore.lat, lng: selectedStore.lng });
      map.setZoom(Math.max(map.getZoom() || defaultZoom || 12, 12));
      return;
    }

    map.setCenter(defaultCenter ?? { lat: -2.5, lng: 118 });
    map.setZoom(defaultZoom ?? 5);
  }, [defaultCenter, defaultZoom, map, selectedStore]);

  const shouldShowAreaSearch = showAreaSearch && parsedParams.bbox === undefined;

  const handleSearchThisArea = useCallback(() => {
    if (!map) {
      return;
    }

    const bounds = map.getBounds();
    if (!bounds) {
      return;
    }

    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();
    const bbox: [number, number, number, number] = [
      Number(southWest.lat().toFixed(4)),
      Number(southWest.lng().toFixed(4)),
      Number(northEast.lat().toFixed(4)),
      Number(northEast.lng().toFixed(4)),
    ];

    const nextQuery = buildSearchParams({
      ...parsedParams,
      bbox,
      lat: undefined,
      lng: undefined,
    });

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    setShowAreaSearch(false);
  }, [map, parsedParams, pathname, router]);

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center">
        {shouldShowAreaSearch ? (
          <button
            type="button"
            onClick={handleSearchThisArea}
            className="pointer-events-auto rounded-full border border-emerald-400 bg-slate-900/90 px-3 py-2 text-sm font-medium text-emerald-200 shadow-lg"
          >
            {t("searchThisArea")}
          </button>
        ) : null}
      </div>

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
      <div className="relative h-full w-full">
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
      </div>
    </APIProvider>
  );
}
