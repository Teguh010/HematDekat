"use client";

import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { StoreSummary } from "@/lib/data/types";
import { PricePin } from "./price-pin";

type ClusteredPinsProps = {
  stores: StoreSummary[];
  hoveredStoreId: string | null;
  selectedStoreId: string | null;
  onSelect: (storeId: string) => void;
  onHover: (storeId: string | null) => void;
};

export function ClusteredPins({ stores, hoveredStoreId, selectedStoreId, onSelect, onHover }: ClusteredPinsProps) {
  const map = useMap();
  const [markers, setMarkers] = useState<Record<string, google.maps.marker.AdvancedMarkerElement>>({});

  const clusterer = useMemo(() => (map ? new MarkerClusterer({ map }) : null), [map]);

  useEffect(() => {
    if (!clusterer) return;
    clusterer.clearMarkers();
    clusterer.addMarkers(Object.values(markers));
  }, [clusterer, markers]);

  useEffect(() => () => clusterer?.setMap(null), [clusterer]);

  const setMarkerRef = useCallback((marker: google.maps.marker.AdvancedMarkerElement | null, id: string) => {
    setMarkers((previous) => {
      if ((marker && previous[id]) || (!marker && !previous[id])) return previous;
      if (marker) return { ...previous, [id]: marker };
      const next = { ...previous };
      delete next[id];
      return next;
    });
  }, []);

  return stores.map((store) => (
    <AdvancedMarker
      key={store.id}
      position={{ lat: store.lat, lng: store.lng }}
      ref={(marker) => setMarkerRef(marker, store.id)}
      onMouseEnter={() => onHover(store.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(store.id)}
      zIndex={store.id === selectedStoreId ? 10 : undefined}
    >
      <PricePin store={store} hovered={store.id === hoveredStoreId} selected={store.id === selectedStoreId} />
    </AdvancedMarker>
  ));
}
