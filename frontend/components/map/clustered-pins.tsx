"use client";

import { MarkerClusterer, SuperClusterAlgorithm } from "@googlemaps/markerclusterer";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { useEffect, useRef } from "react";

import type { StoreSummary } from "@/lib/data/types";
import { formatRupiah } from "@/lib/format";

type ClusteredPinsProps = {
  stores: StoreSummary[];
  hoveredStoreId: string | null;
  selectedStoreId: string | null;
  onSelect: (storeId: string) => void;
  onHover: (storeId: string | null) => void;
};

function paintPin(content: HTMLElement, store: StoreSummary, active: boolean) {
  const price = store.price?.normalizedUnitPrice ?? 0;
  content.style.cssText =
    `display:flex;align-items:center;justify-content:center;transform:translateY(-12px);cursor:pointer;z-index:${active ? 10 : "auto"};`;
  content.innerHTML = `
    <div style="
      border-radius:9999px;
      border:1px solid ${active ? "#a7f3d0" : "#6ee7b7"};
      background:${active ? "#10b981" : "rgba(16,185,129,0.9)"};
      color:#fff;
      font-size:10px;
      font-weight:700;
      padding:4px 8px;
      box-shadow:0 10px 15px -3px rgba(16,185,129,0.35);
      white-space:nowrap;
    ">${formatRupiah(price)}</div>
    <div style="
      margin-left:4px;
      width:16px;
      height:16px;
      border-radius:9999px;
      border:2px solid #fff;
      background:${active ? "#34d399" : "#6ee7b7"};
      box-shadow:0 4px 6px rgba(16,185,129,0.4);
    "></div>
  `;
}

export function ClusteredPins({ stores, hoveredStoreId, selectedStoreId, onSelect, onHover }: ClusteredPinsProps) {
  const map = useMap();
  const markerLibrary = useMapsLibrary("marker");
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef(new Map<string, google.maps.marker.AdvancedMarkerElement>());
  const storesRef = useRef(new Map<string, StoreSummary>());
  const onSelectRef = useRef(onSelect);
  const onHoverRef = useRef(onHover);

  useEffect(() => {
    onSelectRef.current = onSelect;
    onHoverRef.current = onHover;
  }, [onSelect, onHover]);

  // Keep one clusterer + marker set in sync. Combined so Strict Mode remounts
  // always re-attach markers to the live clusterer.
  useEffect(() => {
    if (!map || !markerLibrary) {
      return;
    }

    const clusterer = new MarkerClusterer({
      map,
      algorithm: new SuperClusterAlgorithm({ radius: 100, maxZoom: 14 }),
    });
    clustererRef.current = clusterer;

    const nextIds = new Set(stores.map((store) => store.id));
    storesRef.current = new Map(stores.map((store) => [store.id, store]));

    for (const [id, marker] of markersRef.current) {
      if (!nextIds.has(id)) {
        marker.map = null;
        markersRef.current.delete(id);
      }
    }

    for (const store of stores) {
      let marker = markersRef.current.get(store.id);
      const position = new google.maps.LatLng(store.lat, store.lng);

      if (!marker) {
        const content = document.createElement("div");
        paintPin(content, store, store.id === hoveredStoreId || store.id === selectedStoreId);

        marker = new markerLibrary.AdvancedMarkerElement({
          position,
          content,
          title: store.name,
          gmpClickable: true,
        });

        marker.addEventListener("gmp-click", () => {
          onSelectRef.current(store.id);
        });
        content.addEventListener("mouseenter", () => {
          onHoverRef.current(store.id);
        });
        content.addEventListener("mouseleave", () => {
          onHoverRef.current(null);
        });

        markersRef.current.set(store.id, marker);
      } else {
        marker.position = position;
        marker.title = store.name;
      }
    }

    clusterer.addMarkers([...markersRef.current.values()]);

    return () => {
      clusterer.clearMarkers();
      clusterer.setMap(null);
      if (clustererRef.current === clusterer) {
        clustererRef.current = null;
      }
    };
    // hovered/selected intentionally omitted: pin chrome updates in the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid rebuild clusters on hover
  }, [map, markerLibrary, stores]);

  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      const store = storesRef.current.get(id);
      const content = marker.content;
      if (!store || !(content instanceof HTMLElement)) {
        continue;
      }

      const active = id === hoveredStoreId || id === selectedStoreId;
      paintPin(content, store, active);
    }
  }, [hoveredStoreId, selectedStoreId, stores]);

  return null;
}
