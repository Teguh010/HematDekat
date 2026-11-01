"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CitySelect } from "@/components/filters/city-select";
import { FilterPanel } from "@/components/filters/filter-panel";
import { LocateMeButton } from "@/components/filters/locate-me-button";
import { SearchBar } from "@/components/filters/search-bar";
import { StoreMap } from "@/components/map/store-map";
import { daysSince } from "@/lib/format";
import { buildSearchParams, parseSearchParams } from "@/lib/search-params";
import type { City, Page, Product, StoreSummary } from "@/lib/data/types";
import { ProductSelector } from "./product-selector";
import { StoreCard } from "./store-card";
import { MobileViewToggle } from "./mobile-view-toggle";

type HomeExplorerProps = {
  products: Product[];
  cities: City[];
  initialPage: Page<StoreSummary>;
  params: Record<string, string | string[] | undefined>;
};

export function HomeExplorer({ products, cities, initialPage, params }: HomeExplorerProps) {
  const t = useTranslations("home");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const parsedParams = useMemo(() => parseSearchParams(Object.fromEntries(searchParams.entries())), [searchParams]);
  const [mobileView, setMobileView] = useState<"map" | "list">("map");
  const [hoveredStoreId, setHoveredStoreId] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  const updateProduct = (nextSlug: string) => {
    setHoveredStoreId(null);
    setSelectedStoreId(null);
    const nextQuery = buildSearchParams({ ...parsedParams, product: nextSlug });
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  };

  const activeProduct = useMemo(() => {
    if (params.product && products.some((product) => product.slug === params.product)) {
      return Array.isArray(params.product) ? params.product[0] : params.product;
    }
    return parsedParams.product ?? products[0]?.slug ?? "";
  }, [params.product, parsedParams.product, products]);

  const activeCity = useMemo(() => {
    const cityParam = Array.isArray(params.city) ? params.city[0] : params.city;
    if (cityParam && cities.some((city) => city.slug === cityParam)) {
      return cityParam;
    }
    return parsedParams.city ?? "all";
  }, [cities, params.city, parsedParams.city]);

  const filteredStores = useMemo(() => {
    const q = (parsedParams.q ?? "").trim().toLowerCase();
    const stores = initialPage.items.filter((store) => {
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
  }, [activeCity, activeProduct, initialPage.items, parsedParams]);

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
    <div className="flex min-h-[calc(100dvh-64px)] flex-col bg-slate-950 text-slate-50">
      <div className="border-b border-white/10 bg-slate-950/95 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchBar />

            <div className="flex flex-wrap items-center gap-2">
              <CitySelect cities={cities} />
              <LocateMeButton />
              <FilterPanel />
            </div>
          </div>

          <ProductSelector products={products} value={activeProduct} onChange={updateProduct} />
        </div>
      </div>

      <MobileViewToggle value={mobileView} onChange={setMobileView} />

      <div className="hidden flex-1 min-h-0 lg:flex lg:gap-3 lg:p-4">
        <aside className="w-[400px] shrink-0 overflow-y-auto rounded-[28px] border border-white/10 bg-slate-900 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">{t("nearestStores")}</h2>
          </div>
          <div className="space-y-3">
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

        <div className="min-h-0 flex-1 overflow-hidden rounded-[28px] border border-white/10 bg-slate-900">
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
        </div>
      </div>

      <div className="flex flex-1 min-h-0 lg:hidden">
        {mobileView === "map" ? (
          <div className="h-[calc(100dvh-64px-64px)] w-full overflow-hidden bg-slate-900">
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
          </div>
        ) : (
          <div className="w-full overflow-y-auto p-4">
            <div className="space-y-3">
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
          </div>
        )}
      </div>
    </div>
  );
}
