"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CitySelect } from "@/components/filters/city-select";
import { FilterPanel } from "@/components/filters/filter-panel";
import { LocateMeButton } from "@/components/filters/locate-me-button";
import { SearchBar } from "@/components/filters/search-bar";
import { StoreMap } from "@/components/map/store-map";
import { listStores } from "@/lib/data/repository";
import { daysSince } from "@/lib/format";
import { buildSearchParams, parseSearchParams } from "@/lib/search-params";
import type { City, Page, Product, StoreSummary } from "@/lib/data/types";
import { MapHello } from "./map-hello";
import { ProductSelector } from "./product-selector";
import { StoreCard } from "./store-card";
import { MobileViewToggle } from "./mobile-view-toggle";

type HomeExplorerProps = {
  products: Product[];
  cities: City[];
  initialPage: Page<StoreSummary>;
  lockedCity?: string;
  /** When true, fill the parent height (home). When false, use a fixed panel height (city page). */
  fillViewport?: boolean;
};

export function HomeExplorer({
  products,
  cities,
  initialPage,
  lockedCity,
  fillViewport = true,
}: HomeExplorerProps) {
  const t = useTranslations("home");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const parsedParams = useMemo(() => parseSearchParams(Object.fromEntries(searchParams.entries())), [searchParams]);
  const [mobileView, setMobileView] = useState<"map" | "list">("map");
  const [hoveredStoreId, setHoveredStoreId] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [storesPage, setStoresPage] = useState(initialPage);
  const loadedProductRef = useRef(
    initialPage.items.find((store) => store.price)?.price?.productSlug ?? "beras-premium",
  );

  const updateProduct = (nextSlug: string) => {
    setHoveredStoreId(null);
    setSelectedStoreId(null);
    const nextQuery = buildSearchParams({ ...parsedParams, product: nextSlug });
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  };

  const activeProduct = useMemo(() => {
    if (parsedParams.product && products.some((product) => product.slug === parsedParams.product)) {
      return parsedParams.product;
    }
    return products.find((product) => product.slug === "beras-premium")?.slug ?? products[0]?.slug ?? "";
  }, [parsedParams.product, products]);

  const activeCity = useMemo(() => {
    if (lockedCity) {
      return lockedCity;
    }

    if (parsedParams.city && cities.some((city) => city.slug === parsedParams.city)) {
      return parsedParams.city;
    }

    return "all";
  }, [cities, lockedCity, parsedParams.city]);

  useEffect(() => {
    if (!activeProduct || activeProduct === loadedProductRef.current) {
      return;
    }

    let cancelled = false;
    const product = activeProduct;

    listStores({
      limit: 50,
      product,
      city: lockedCity,
    })
      .then((page) => {
        if (cancelled) {
          return;
        }
        loadedProductRef.current = product;
        setStoresPage(page);
      })
      .catch(() => {
        // Keep the previous page visible; the list/map stay usable.
      });

    return () => {
      cancelled = true;
    };
  }, [activeProduct, lockedCity]);

  const filteredStores = useMemo(() => {
    const q = (parsedParams.q ?? "").trim().toLowerCase();
    const stores = storesPage.items.filter((store) => {
      if (activeCity !== "all" && store.city.slug !== activeCity) {
        return false;
      }

      if (activeProduct && store.price?.productSlug !== activeProduct) {
        return false;
      }

      if (q) {
        const haystack = [store.name, store.city.name, store.district ?? ""].join(" ").toLowerCase();
        if (!haystack.includes(q)) {
          return false;
        }
      }

      if ((parsedParams.type?.length ?? 0) > 0 && !parsedParams.type!.includes(store.type)) {
        return false;
      }

      if (parsedParams.maxPrice != null) {
        if (!store.price) {
          return false;
        }
        if (store.price.normalizedUnitPrice > parsedParams.maxPrice) {
          return false;
        }
      }

      if (parsedParams.promo && !store.hasActivePromo) {
        return false;
      }

      if (parsedParams.fresh && (!store.price || daysSince(store.price.verifiedAt) > parsedParams.fresh)) {
        return false;
      }

      return true;
    });

    return [...stores].sort((a, b) => {
      switch (parsedParams.sort ?? "cheapest") {
        case "nearest": {
          const aDistance = a.distanceKm ?? Number.POSITIVE_INFINITY;
          const bDistance = b.distanceKm ?? Number.POSITIVE_INFINITY;
          return aDistance - bDistance;
        }
        case "recent": {
          const aTime = a.price ? Date.parse(a.price.verifiedAt) : 0;
          const bTime = b.price ? Date.parse(b.price.verifiedAt) : 0;
          return bTime - aTime;
        }
        case "cheapest":
        default: {
          const aPrice = a.price?.normalizedUnitPrice ?? Number.POSITIVE_INFINITY;
          const bPrice = b.price?.normalizedUnitPrice ?? Number.POSITIVE_INFINITY;
          return aPrice - bPrice;
        }
      }
    });
  }, [activeCity, activeProduct, parsedParams, storesPage.items]);

  const selectedCityCenter = useMemo(() => {
    if (activeCity === "all") {
      return { lat: -2.5, lng: 118 };
    }

    const city = cities.find((item) => item.slug === activeCity);
    if (!city) {
      return { lat: -2.5, lng: 118 };
    }

    return { lat: city.centerLat, lng: city.centerLng };
  }, [activeCity, cities]);

  useEffect(() => {
    if (!selectedStoreId) {
      return;
    }

    const node = document.querySelector(`[data-store-id="${selectedStoreId}"]`);
    if (node instanceof HTMLElement) {
      node.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedStoreId]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  return (
    <div
      className={`relative flex min-h-0 flex-col overflow-hidden bg-ink-50 text-ink-900 ${
        fillViewport ? "h-full flex-1" : "h-[70dvh] min-h-[28rem]"
      }`}
    >
      <div className="shrink-0 border-b border-ink-200 bg-surface px-3 py-2">
        <div className="flex w-full flex-col gap-2">
          <div className="flex items-center gap-2">
            <SearchBar />
            {!lockedCity ? <CitySelect cities={cities} /> : null}
            <LocateMeButton />
            <FilterPanel />
          </div>

          <ProductSelector products={products} value={activeProduct} onChange={updateProduct} />
        </div>
      </div>

      <div className="hidden min-h-0 flex-1 gap-3 overflow-hidden p-3 lg:flex">
        <aside className="flex w-[360px] shrink-0 flex-col overflow-hidden rounded-2xl border border-ink-200 bg-surface shadow-warm">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-ink-200 px-3 py-2">
            <h2 className="text-sm font-semibold text-ink-900">{t("nearestStores")}</h2>
            <span aria-live="polite" className="text-xs text-ink-500">{t("resultCount", { count: filteredStores.length })}</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {filteredStores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                selectedProduct={activeProduct}
                isHighlighted={store.id === hoveredStoreId || store.id === selectedStoreId}
                onHoverChange={setHoveredStoreId}
                onSelect={setSelectedStoreId}
              />
            ))}
          </div>
        </aside>

        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-2xl shadow-warm">
          <StoreMap
            stores={filteredStores}
            apiKey={apiKey}
            defaultCenter={selectedCityCenter}
            defaultZoom={activeCity === "all" ? 5 : 12}
            hoveredStoreId={hoveredStoreId}
            selectedStoreId={selectedStoreId}
            onSelectStore={setSelectedStoreId}
            onHoverStore={setHoveredStoreId}
          />
          <MapHello />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:hidden">
        {mobileView === "map" ? (
          <div className="relative min-h-0 w-full flex-1 overflow-hidden bg-ink-100">
            <StoreMap
              stores={filteredStores}
              apiKey={apiKey}
              defaultCenter={selectedCityCenter}
              defaultZoom={activeCity === "all" ? 5 : 12}
              hoveredStoreId={hoveredStoreId}
              selectedStoreId={selectedStoreId}
              onSelectStore={setSelectedStoreId}
              onHoverStore={setHoveredStoreId}
            />
            <MapHello placement="mobile" />
          </div>
        ) : (
          <div className="min-h-0 w-full flex-1 overflow-y-auto bg-surface pb-14">
            <p aria-live="polite" className="border-b border-ink-100 px-3 py-2 text-xs text-ink-500">
              {t("resultCount", { count: filteredStores.length })}
            </p>
            {filteredStores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                selectedProduct={activeProduct}
                isHighlighted={store.id === hoveredStoreId || store.id === selectedStoreId}
                onHoverChange={setHoveredStoreId}
                onSelect={setSelectedStoreId}
              />
            ))}
          </div>
        )}
      </div>

      <MobileViewToggle value={mobileView} onChange={setMobileView} />
    </div>
  );
}
