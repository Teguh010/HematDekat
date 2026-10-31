"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { AppHeader, type AppUser } from "@/components/app-header";
import { ProductSelector } from "@/components/product-selector";
import { StoreCard } from "@/components/store-card";
import { StoreMap } from "@/components/store-map";
import { fetchStores, type Store } from "@/lib/data/repository";
import { formatRupiah } from "@/lib/format";

const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function Home() {
  const t = useTranslations("home");
  const productNames = [
    t("productNames.berasPremium"),
    t("productNames.minyakGorengCurah"),
    t("productNames.gulaPasir"),
    t("productNames.telurAyam"),
  ];
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedProduct, setSelectedProduct] = useState(productNames[0]);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(`${backendBaseUrl}/auth/me`, {
          credentials: "include",
        });

        if (!response.ok) {
          setCurrentUser(null);
          return;
        }

        const data = (await response.json()) as AppUser;
        setCurrentUser(data);
      } catch {
        setCurrentUser(null);
      }
    };

    const loadStores = async () => {
      const data = await fetchStores();
      setStores(data);
      const availableProducts = Array.from(new Set(data.flatMap((store) => store.products.map((product) => product.name))));
      if (availableProducts.length > 0) {
        setSelectedProduct((current) => (availableProducts.includes(current) ? current : availableProducts[0]));
      }
    };

    void fetchCurrentUser();
    void loadStores();
  }, []);

  const cheapestStore = [...stores]
    .map((store) => ({
      ...store,
      product: store.products.find((item) => item.name === selectedProduct),
    }))
    .filter((store) => store.product)
    .sort((a, b) => (a.product?.normalizedUnitPrice ?? 0) - (b.product?.normalizedUnitPrice ?? 0))[0];

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  const handleLogout = async () => {
    await fetch(`${backendBaseUrl}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <AppHeader currentUser={currentUser} onLogout={handleLogout} />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-3xl border border-white/10 bg-slate-900 p-4 shadow-2xl shadow-emerald-950/30">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-300">{t("selectedProduct")}</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">{selectedProduct}</h2>
              </div>
              <ProductSelector items={productNames} value={selectedProduct} onChange={setSelectedProduct} />
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/15 to-slate-900 p-4">
            <p className="text-sm text-emerald-200">{t("cheapestNow")}</p>
            <div className="mt-3 space-y-2">
              <p className="text-2xl font-bold text-white">{cheapestStore?.name ?? "-"}</p>
              <p className="text-sm text-slate-300">{cheapestStore?.district ?? "-"}</p>
              <p className="text-3xl font-black text-emerald-300">{formatRupiah(cheapestStore?.product?.normalizedUnitPrice ?? 0)}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[28px] border border-white/10 bg-slate-900 p-3 shadow-xl shadow-slate-950/30">
            <div className="flex items-center justify-between border-b border-white/10 px-3 pb-3 pt-1">
              <div>
                <p className="text-sm text-slate-400">{t("mapDistribution")}</p>
                <h2 className="text-lg font-semibold text-white">{t("storeLocations")}</h2>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {t("locationsCount", { count: stores.length })}
              </div>
            </div>

            <div className="mt-4 h-[420px] overflow-hidden rounded-2xl border border-white/10">
              <StoreMap stores={stores} apiKey={apiKey} />
            </div>
          </div>

          <aside className="space-y-4 rounded-[28px] border border-white/10 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{t("nearestStores")}</h2>
              <button type="button" className="text-sm text-emerald-300">
                {t("seeAll")}
              </button>
            </div>

            <div className="space-y-3">
              {stores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
