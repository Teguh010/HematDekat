"use client";

import { MarkerClusterer, SuperClusterAlgorithm, type Cluster } from "@googlemaps/markerclusterer";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { useEffect, useRef } from "react";

import type { StoreSummary } from "@/lib/data/types";
import { formatRupiah } from "@/lib/format";
import { toneForProduct } from "@/lib/product-tones";

type ClusteredPinsProps = {
  stores: StoreSummary[];
  hoveredStoreId: string | null;
  selectedStoreId: string | null;
  onSelect: (storeId: string) => void;
  onHover: (storeId: string | null) => void;
};

// Pins are DOM elements, so they use Tailwind token classes (brand-*, ink-*, surface)
// instead of hex values. Keep the class names as full literals so Tailwind can see them.
function paintPin(content: HTMLElement, store: StoreSummary, state: { hovered: boolean; selected: boolean }) {
  const price = store.price?.normalizedUnitPrice ?? null;

  content.className = "flex cursor-pointer items-center justify-center";
  content.style.zIndex = state.selected ? "10" : "auto";

  const button = document.createElement("button");
  button.type = "button";
  button.tabIndex = 0;
  button.className = "focus-ring flex items-center justify-center rounded-full bg-transparent p-0";
  button.setAttribute("aria-label", price === null ? store.name : `${store.name}, ${formatRupiah(price)}`);

  const face = document.createElement("span");

  if (price === null) {
    face.className = `inline-block h-3 w-3 rounded-full ring-2 ring-surface ${
      state.selected ? "bg-ink-900" : "bg-ink-400"
    }`;
  } else {
    const shell = state.selected
      ? "bg-brand-600 text-on-brand ring-2 ring-surface"
      : state.hovered
        ? "bg-brand-50 text-brand-800 ring-1 ring-brand-200"
        : "bg-surface text-brand-700 ring-1 ring-ink-200";
    face.className = `inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold leading-4 shadow-warm ${shell}`;

    const dot = document.createElement("span");
    dot.setAttribute("aria-hidden", "true");
    dot.className = `inline-block h-2 w-2 shrink-0 rounded-full ${
      state.selected ? "bg-surface" : toneForProduct(store.price?.productSlug).dot
    }`;
    face.append(dot, document.createTextNode(formatRupiah(price)));
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
          // SVG circles with their own opacity. A div background, even at 55%,
          // plus blur and shadow reads as a solid disc and hides the map.
          const size = count < 10 ? 48 : count < 50 ? 56 : 64;
          const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svg.setAttribute("viewBox", "0 0 240 240");
          svg.setAttribute("width", String(size));
          svg.setAttribute("height", String(size));
          svg.setAttribute("aria-hidden", "true");

          for (const [radius, opacity] of [["92", "0.78"]] as const) {
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", "120");
            circle.setAttribute("cy", "120");
            circle.setAttribute("r", radius);
            circle.setAttribute("fill", "var(--color-brand-600)");
            circle.setAttribute("opacity", opacity);
            svg.append(circle);

            // Stroke sits on its own shape so the white ring stays solid while the fill stays translucent.
            const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            ring.setAttribute("cx", "120");
            ring.setAttribute("cy", "120");
            ring.setAttribute("r", radius);
            ring.setAttribute("fill", "none");
            ring.setAttribute("stroke", "var(--color-surface)");
            ring.setAttribute("stroke-width", "10");
            svg.append(ring);
          }

          const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
          label.setAttribute("x", "120");
          label.setAttribute("y", "120");
          label.setAttribute("text-anchor", "middle");
          label.setAttribute("dominant-baseline", "central");
          label.setAttribute("fill", "var(--color-on-brand)");
          label.setAttribute("font-size", "72");
          label.setAttribute("font-weight", "700");
          label.textContent = String(count);
          svg.append(label);

          return new markerLibrary.AdvancedMarkerElement({
            position,
            content: svg,
            title: String(count),
            // Default anchor is the bottom center, which floats the bubble above the point.
            anchorLeft: "-50%",
            anchorTop: "-50%",
          });
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
