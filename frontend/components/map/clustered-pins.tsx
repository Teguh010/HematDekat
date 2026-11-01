"use client";

import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { memo, useCallback, useEffect, useRef } from "react";

import type { StoreSummary } from "@/lib/data/types";
import { PricePin } from "./price-pin";

type ClusteredPinsProps = {
  stores: StoreSummary[];
  hoveredStoreId: string | null;
  selectedStoreId: string | null;
  onSelect: (storeId: string) => void;
  onHover: (storeId: string | null) => void;
};

type PinProps = {
  store: StoreSummary;
  hovered: boolean;
  selected: boolean;
  onSelect: (storeId: string) => void;
  onHover: (storeId: string | null) => void;
  setMarkerRef: (marker: google.maps.marker.AdvancedMarkerElement | null, id: string) => void;
};

const ClusteredPin = memo(function ClusteredPin({
  store,
  hovered,
  selected,
  onSelect,
  onHover,
  setMarkerRef,
}: PinProps) {
  // Keep the ref callback identity stable for this store so React does not
  // call the previous ref with null on every parent re-render (hover/select).
  const ref = useCallback(
    (marker: google.maps.marker.AdvancedMarkerElement | null) => {
      setMarkerRef(marker, store.id);
    },
    [setMarkerRef, store.id],
  );

  return (
    <AdvancedMarker
      position={{ lat: store.lat, lng: store.lng }}
      ref={ref}
      onMouseEnter={() => onHover(store.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(store.id)}
      zIndex={selected ? 10 : undefined}
    >
      <PricePin store={store} hovered={hovered} selected={selected} />
    </AdvancedMarker>
  );
});

export function ClusteredPins({ stores, hoveredStoreId, selectedStoreId, onSelect, onHover }: ClusteredPinsProps) {
  const map = useMap();
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());

  useEffect(() => {
    if (!map) {
      return;
    }

    const clusterer = new MarkerClusterer({ map });
    clustererRef.current = clusterer;

    return () => {
      clusterer.setMap(null);
      clustererRef.current = null;
    };
  }, [map]);

  const syncClusterer = useCallback(() => {
    const clusterer = clustererRef.current;
    if (!clusterer) {
      return;
    }

    clusterer.clearMarkers();
    clusterer.addMarkers([...markersRef.current.values()]);
  }, []);

  // Drop markers for stores that left the list (for example after a product change).
  useEffect(() => {
    const validIds = new Set(stores.map((store) => store.id));
    let removed = false;

    for (const id of markersRef.current.keys()) {
      if (!validIds.has(id)) {
        markersRef.current.delete(id);
        removed = true;
      }
    }

    if (removed) {
      syncClusterer();
    }
  }, [stores, syncClusterer]);

  const setMarkerRef = useCallback(
    (marker: google.maps.marker.AdvancedMarkerElement | null, id: string) => {
      const markers = markersRef.current;

      if (marker) {
        if (markers.get(id) === marker) {
          return;
        }
        markers.set(id, marker);
      } else if (markers.has(id)) {
        markers.delete(id);
      } else {
        return;
      }

      syncClusterer();
    },
    [syncClusterer],
  );

  return stores.map((store) => (
    <ClusteredPin
      key={store.id}
      store={store}
      hovered={store.id === hoveredStoreId}
      selected={store.id === selectedStoreId}
      onSelect={onSelect}
      onHover={onHover}
      setMarkerRef={setMarkerRef}
    />
  ));
}
