"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { APIProvider, AdvancedMarker, Map } from "@vis.gl/react-google-maps";

import { getStores } from "@/lib/data/repository";

const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

const productNames = [
  "Beras premium",
  "Minyak goreng curah",
  "Gula pasir",
  "Telur ayam",
];

export default function Home() {
  const stores = getStores();
  const [selectedProduct, setSelectedProduct] = useState(productNames[0]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

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

        const data = (await response.json()) as AuthUser;
        setCurrentUser(data);
      } catch {
        setCurrentUser(null);
      }
    };

    void fetchCurrentUser();
  }, []);

  const cheapestStore = [...stores]
    .map((store) => ({
      ...store,
      product: store.products.find((item) => item.name === selectedProduct),
    }))
    .filter((store) => store.product)
    .sort((a, b) => (a.product?.normalizedUnitPrice ?? 0) - (b.product?.normalizedUnitPrice ?? 0))[0];

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-400">Sembako Murah</p>
            <h1 className="mt-1 text-2xl font-bold text-white">Map Harga Sembako</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/cities" className="rounded-full border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200 transition hover:border-emerald-400">Kota</Link>
            <Link href="/report" className="rounded-full border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200 transition hover:border-emerald-400">Laporkan</Link>
            {currentUser ? (
              <>
                <button
                  type="button"
                  className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200 transition hover:bg-emerald-500/15"
                >
                  Halo, {currentUser.name ?? currentUser.email.split("@")[0]}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await fetch(`${backendBaseUrl}/auth/logout`, {
                      method: "POST",
                      credentials: "include",
                    });
                    setCurrentUser(null);
                  }}
                  className="rounded-full border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-500"
                >
                  Keluar
                </button>
              </>
            ) : (
              <Link href="/login" className="rounded-full border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200 transition hover:border-emerald-400">Masuk</Link>
            )}
            <Link href="/admin" className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200 transition hover:bg-emerald-500/15">Admin</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-3xl border border-white/10 bg-slate-900 p-4 shadow-2xl shadow-emerald-950/30">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-300">Produk terpilih</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">{selectedProduct}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {productNames.map((product) => (
                  <button
                    key={product}
                    type="button"
                    aria-pressed={product === selectedProduct}
                    onClick={() => setSelectedProduct(product)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      product === selectedProduct
                        ? "border-emerald-400 bg-emerald-500/15 text-emerald-200"
                        : "border-white/10 bg-slate-800 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    {product}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/15 to-slate-900 p-4">
            <p className="text-sm text-emerald-200">Toko termurah saat ini</p>
            <div className="mt-3 space-y-2">
              <p className="text-2xl font-bold text-white">{cheapestStore?.name ?? "-"}</p>
              <p className="text-sm text-slate-300">{cheapestStore?.district ?? "-"}</p>
              <p className="text-3xl font-black text-emerald-300">
                {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
                  cheapestStore?.product?.normalizedUnitPrice ?? 0,
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[28px] border border-white/10 bg-slate-900 p-3 shadow-xl shadow-slate-950/30">
            <div className="flex items-center justify-between border-b border-white/10 px-3 pb-3 pt-1">
              <div>
                <p className="text-sm text-slate-400">Peta distribusi</p>
                <h2 className="text-lg font-semibold text-white">Lokasi toko</h2>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                5 lokasi
              </div>
            </div>

            <div className="mt-4 h-[420px] overflow-hidden rounded-2xl border border-white/10">
              {apiKey ? (
                <APIProvider apiKey={apiKey}>
                  <Map
                    defaultCenter={{ lat: -6.9, lng: 107.7 }}
                    defaultZoom={6}
                    gestureHandling="greedy"
                    disableDefaultUI={false}
                    mapId="sembako-map"
                    style={{ width: "100%", height: "100%" }}
                  >
                    {stores.map((store) => (
                      <AdvancedMarker
                        key={store.id}
                        position={{ lat: store.coordinates.lat, lng: store.coordinates.lng }}
                        title={store.name}
                      >
                        <div className="flex -translate-y-3 items-center justify-center">
                          <div className="rounded-full border border-emerald-300 bg-emerald-500 px-2 py-1 text-[10px] font-bold text-white shadow-lg shadow-emerald-500/50">
                            Rp {Math.min(...store.products.map((item) => item.price)).toLocaleString("id-ID")}
                          </div>
                          <div className="ml-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-400 shadow-md shadow-emerald-500/60" />
                        </div>
                      </AdvancedMarker>
                    ))}
                  </Map>
                </APIProvider>
              ) : (
                <div className="flex h-full items-center justify-center bg-slate-800 text-sm text-slate-300">
                  Google Maps API key belum tersedia. Isi variabel NEXT_PUBLIC_GOOGLE_MAPS_API_KEY di .env.local.
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-4 rounded-[28px] border border-white/10 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Toko terdekat</h2>
              <button type="button" className="text-sm text-emerald-300">Lihat semua</button>
            </div>

            <div className="space-y-3">
              {stores.map((store) => {
                const lowestProduct = [...store.products].sort((a, b) => a.price - b.price)[0];

                return (
                  <article key={store.id} className="rounded-2xl border border-white/10 bg-slate-800 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-white">{store.name}</h3>
                        <p className="mt-1 text-sm text-slate-400">{store.district}, {store.city}</p>
                      </div>
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-emerald-300">
                        {store.type}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm text-slate-300">
                      <span>⭐ {store.rating}</span>
                      <span>{store.distanceKm} km</span>
                    </div>

                    <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/80 p-2">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Harga paling murah</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-medium text-slate-200">{lowestProduct.name}</span>
                        <span className="text-base font-bold text-emerald-300">
                          {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(lowestProduct.price)}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
