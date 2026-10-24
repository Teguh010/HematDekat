import Link from "next/link";
import { Suspense } from "react";

import { fetchCities, fetchStores } from "@/lib/data/repository";

async function CitiesPageContent() {
  const [cities, stores] = await Promise.all([fetchCities(), fetchStores()]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-400">Lokasi</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Kota dan pasar</h1>
        </div>
        <Link href="/" className="rounded-full border border-white/10 bg-slate-800 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400">
          Kembali ke peta
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cities.map((city) => {
          const cityStores = stores.filter((store) => store.city === city.name);
          const cheapest = [...cityStores]
            .flatMap((store) => store.products.map((product) => ({ store, product })))
            .sort((a, b) => a.product.normalizedUnitPrice - b.product.normalizedUnitPrice)[0];

          return (
            <Link
              key={city.slug}
              href={`/cities/${city.slug}`}
              className="rounded-3xl border border-white/10 bg-slate-900 p-5 transition hover:border-emerald-400/60 hover:bg-slate-800"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-400">{city.province}</p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">{city.name}</h2>
                </div>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                  {city.storeCount} toko
                </span>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Harga termurah</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-200">{cheapest?.product.name ?? "-"}</p>
                    <p className="text-sm text-slate-400">{cheapest?.store.name ?? "Belum ada data"}</p>
                  </div>
                  <span className="text-lg font-bold text-emerald-300">
                    {cheapest
                      ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
                          cheapest.product.normalizedUnitPrice,
                        )
                      : "-"}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}

export default function CitiesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-300">Memuat daftar kota...</div>}>
      <CitiesPageContent />
    </Suspense>
  );
}
