"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { StoreMap } from "@/components/store-map";
import type { City, Page, Product, StoreSummary } from "@/lib/data/types";
import { MobileViewToggle } from "./mobile-view-toggle";
import { StoreList } from "./store-list";

type HomeExplorerProps = {
  products: Product[];
  cities: City[];
  initialPage: Page<StoreSummary>;
  params: Record<string, string | string[] | undefined>;
};

export function HomeExplorer({ products, cities, initialPage, params }: HomeExplorerProps) {
  const t = useTranslations("home");
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

  const stores = useMemo(() => {
    if (selectedCity === "all") {
      return initialPage.items;
    }
    return initialPage.items.filter((store) => store.city.slug === selectedCity);
  }, [initialPage.items, selectedCity]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

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
                onChange={(event) => setSelectedCity(event.target.value)}
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

          <div className="overflow-x-auto">
            <div className="flex min-w-max gap-2 pb-1">
              {products.map((product) => (
                <button
                  key={product.slug}
                  type="button"
                  aria-pressed={selectedProduct === product.slug}
                  onClick={() => setSelectedProduct(product.slug)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    selectedProduct === product.slug
                      ? "border-emerald-400 bg-emerald-500/15 text-emerald-200"
                      : "border-white/10 bg-slate-800 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  {product.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <MobileViewToggle value={mobileView} onChange={setMobileView} />

      <div className="hidden flex-1 min-h-0 lg:flex lg:gap-3 lg:p-4">
        <aside className="w-[400px] shrink-0 overflow-y-auto rounded-[28px] border border-white/10 bg-slate-900 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">{t("nearestStores")}</h2>
          </div>
          <StoreList stores={stores} />
        </aside>

        <div className="min-h-0 flex-1 overflow-hidden rounded-[28px] border border-white/10 bg-slate-900">
          <StoreMap stores={stores} apiKey={apiKey} />
        </div>
      </div>

      <div className="flex flex-1 min-h-0 lg:hidden">
        {mobileView === "map" ? (
          <div className="h-[calc(100dvh-64px-64px)] w-full overflow-hidden bg-slate-900">
            <StoreMap stores={stores} apiKey={apiKey} />
          </div>
        ) : (
          <div className="w-full overflow-y-auto p-4">
            <StoreList stores={stores} />
          </div>
        )}
      </div>
    </div>
  );
}
