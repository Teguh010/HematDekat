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

const INDONESIA_CENTER = { lat: -2.5, lng: 118 };

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
  const appliedCityCameraRef = useRef<string | null>(null);
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

  // Pan only when a store is selected. Clearing selection must not reset the camera.
  useEffect(() => {
    if (!map || !selectedStore) {
      return;
    }

    programmaticUpdateRef.current = true;
    map.panTo({ lat: selectedStore.lat, lng: selectedStore.lng });
    map.setZoom(Math.max(map.getZoom() || defaultZoom || 12, 12));
  }, [defaultZoom, map, selectedStore]);

  // Apply city / Indonesia camera only when the intended center or zoom changes
  // (for example city filter), not on every product change or selection clear.
  useEffect(() => {
    if (!map || selectedStore) {
      return;
    }

    const lat = defaultCenter?.lat ?? INDONESIA_CENTER.lat;
    const lng = defaultCenter?.lng ?? INDONESIA_CENTER.lng;
    const zoom = defaultZoom ?? 5;
    const key = `${lat.toFixed(5)},${lng.toFixed(5)},${zoom}`;

    if (appliedCityCameraRef.current === key) {
      return;
    }

    appliedCityCameraRef.current = key;
    programmaticUpdateRef.current = true;
    map.setCenter({ lat, lng });
    map.setZoom(zoom);
  }, [defaultCenter?.lat, defaultCenter?.lng, defaultZoom, map, selectedStore]);

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
      <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center">
        {shouldShowAreaSearch ? (
          <button
            type="button"
            onClick={handleSearchThisArea}
            className="pointer-events-auto h-8 rounded-full border border-slate-300 bg-white px-3 text-sm font-medium text-emerald-700 shadow-sm hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
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
  defaultCenter = INDONESIA_CENTER,
  defaultZoom = 5,
  hoveredStoreId = null,
  selectedStoreId = null,
  onSelectStore,
  onHoverStore,
}: StoreMapProps) {
  const t = useTranslations("map");

  if (!apiKey) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-100 text-sm text-slate-600">
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
