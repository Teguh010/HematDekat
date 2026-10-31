"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { StoreMap } from "@/components/store-map";
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

  const productParam = Array.isArray(params.product) ? params.product[0] : params.product;
  const cityParam = Array.isArray(params.city) ? params.city[0] : params.city;

  const [selectedProduct, setSelectedProduct] = useState(() => {
    if (productParam && products.some((product) => product.slug === productParam)) {
      return productParam;
    }
    return products[0]?.slug ?? "";
  });

  const [selectedCity, setSelectedCity] = useState(() => {
    if (cityParam && cities.some((city) => city.slug === cityParam)) {
      return cityParam;
    }
    return "all";
  });

  const [mobileView, setMobileView] = useState<"map" | "list">("map");

  const filteredStores = useMemo(() => {
    const stores = initialPage.items.filter((store) => {
      if (selectedCity !== "all" && store.city.slug !== selectedCity) {
        return false;
      }

      if (!selectedProduct) {
        return true;
      }

      return store.price?.productSlug === selectedProduct;
    });

    return [...stores].sort((a, b) => {
      const aPrice = a.price?.normalizedUnitPrice ?? Number.POSITIVE_INFINITY;
      const bPrice = b.price?.normalizedUnitPrice ?? Number.POSITIVE_INFINITY;
      return aPrice - bPrice;
    });
  }, [initialPage.items, selectedCity, selectedProduct]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  const updateCity = (nextCity: string) => {
    setSelectedCity(nextCity);
    const params = new URLSearchParams(searchParams.toString());
    if (nextCity === "all") {
      params.delete("city");
    } else {
      params.set("city", nextCity);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex min-h-[calc(100dvh-64px)] flex-col bg-slate-950 text-slate-50">
      <div className="border-b border-white/10 bg-slate-950/95 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex-1">
              <label className="sr-only" htmlFor="home-search">
                {t("searchPlaceholder")}
              </label>
              <input
                id="home-search"
                type="search"
                placeholder={t("searchPlaceholder")}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor="home-city">
                {t("cityLabel")}
              </label>
              <select
                id="home-city"
                value={selectedCity}
                onChange={(event) => updateCity(event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
              >
                <option value="all">{t("cityLabel")}</option>
                {cities.map((city) => (
                  <option key={city.slug} value={city.slug}>
                    {city.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="rounded-full border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:border-emerald-400"
              >
                {t("locateMe")}
              </button>

              <button
                type="button"
                className="rounded-full border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:border-emerald-400"
              >
                {t("filter")}
              </button>
            </div>
          </div>

          <ProductSelector
            products={products}
            value={selectedProduct}
            onChange={(nextSlug) => setSelectedProduct(nextSlug)}
          />
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
              <StoreCard key={store.id} store={store} selectedProduct={selectedProduct} />
            ))}
          </div>
        </aside>

        <div className="min-h-0 flex-1 overflow-hidden rounded-[28px] border border-white/10 bg-slate-900">
          <StoreMap stores={filteredStores} apiKey={apiKey} />
        </div>
      </div>

      <div className="flex flex-1 min-h-0 lg:hidden">
        {mobileView === "map" ? (
          <div className="h-[calc(100dvh-64px-64px)] w-full overflow-hidden bg-slate-900">
            <StoreMap stores={filteredStores} apiKey={apiKey} />
          </div>
        ) : (
          <div className="w-full overflow-y-auto p-4">
            <div className="space-y-3">
              {filteredStores.map((store) => (
                <StoreCard key={store.id} store={store} selectedProduct={selectedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
