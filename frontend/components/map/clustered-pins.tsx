"use client";

import { MarkerClusterer, SuperClusterAlgorithm, type Cluster } from "@googlemaps/markerclusterer";
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

// Pins are DOM elements with inline styles, so these hex values mirror the
// Tailwind tokens in plan.md "Target design tokens".
const PIN_COLORS = {
  emerald600: "#059669",
  emerald700: "#047857",
  slate900: "#0f172a",
  slate400: "#94a3b8",
  white: "#ffffff",
};

function paintPin(content: HTMLElement, store: StoreSummary, state: { hovered: boolean; selected: boolean }) {
  const price = store.price?.normalizedUnitPrice ?? null;

  content.style.cssText = `display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:${
    state.selected ? 10 : "auto"
  };`;

  const button = document.createElement("button");
  button.type = "button";
  button.tabIndex = 0;
  button.setAttribute("aria-label", price === null ? store.name : `${store.name}, ${formatRupiah(price)}`);
  Object.assign(button.style, {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "0",
    background: "transparent",
    padding: "0",
    cursor: "pointer",
    font: "inherit",
  });

  const face = document.createElement("span");

  if (price === null) {
    Object.assign(face.style, {
      display: "inline-block",
      width: "12px",
      height: "12px",
      borderRadius: "9999px",
      background: state.selected ? PIN_COLORS.slate900 : PIN_COLORS.slate400,
      boxShadow: `0 0 0 2px ${PIN_COLORS.white}`,
    });
  } else {
    face.textContent = formatRupiah(price);
    Object.assign(face.style, {
      borderRadius: "9999px",
      background: state.selected
        ? PIN_COLORS.slate900
        : state.hovered
          ? PIN_COLORS.emerald700
          : PIN_COLORS.emerald600,
      color: PIN_COLORS.white,
      fontSize: "12px",
      fontWeight: "600",
      lineHeight: "16px",
      padding: "2px 8px",
      whiteSpace: "nowrap",
      boxShadow: state.selected
        ? `0 0 0 2px ${PIN_COLORS.white}, 0 1px 3px rgba(15,23,42,0.35)`
        : `0 0 0 1px ${PIN_COLORS.white}, 0 1px 2px rgba(15,23,42,0.25)`,
    });
  }

  button.appendChild(face);
  content.replaceChildren(button);
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
      renderer: {
        render: ({ count, position }: Cluster) => {
          const size = count < 10 ? 32 : count < 50 ? 38 : 44;
          const element = document.createElement("div");
          element.textContent = String(count);
          Object.assign(element.style, {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: "9999px",
            background: PIN_COLORS.emerald600,
            color: PIN_COLORS.white,
            fontSize: "12px",
            fontWeight: "600",
            boxShadow: `0 0 0 2px ${PIN_COLORS.white}, 0 1px 3px rgba(15,23,42,0.35)`,
          });

          return new markerLibrary.AdvancedMarkerElement({ position, content: element });
        },
      },
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
        paintPin(content, store, {
          hovered: store.id === hoveredStoreId,
          selected: store.id === selectedStoreId,
        });

        marker = new markerLibrary.AdvancedMarkerElement({
          position,
          content,
          title: store.name,
          gmpClickable: true,
        });

        marker.addEventListener("gmp-click", () => {
          onSelectRef.current(store.id);
        });
        content.addEventListener("click", () => {
          onSelectRef.current(store.id);
        });
        content.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelectRef.current(store.id);
          }
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

      paintPin(content, store, { hovered: id === hoveredStoreId, selected: id === selectedStoreId });
    }
  }, [hoveredStoreId, selectedStoreId, stores]);

  return null;
}
