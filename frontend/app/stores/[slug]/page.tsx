import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getStoreBySlug, getStores } from "@/lib/data/repository";

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return params.then(({ slug }) => {
    const store = getStoreBySlug(slug);

    return {
      title: `${store?.name ?? "Toko"} | Sembako Murah`,
      description: `Lihat harga sembako dan promo terbaru di ${store?.name ?? "toko ini"}.`,
    };
  });
}

export function generateStaticParams() {
  return getStores().map((store) => ({ slug: store.id }));
}

type StorePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params;
  const store = getStoreBySlug(slug);

  if (!store) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-400">Toko</p>
          <h1 className="mt-2 text-3xl font-bold text-white">{store.name}</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/cities" className="rounded-full border border-white/10 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:border-emerald-400">
            Kembali ke kota
          </Link>
          <Link href="/" className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-500/15">
            Ke peta
          </Link>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Info toko</p>
          <dl className="mt-4 space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-400">Kota</dt>
              <dd className="font-medium text-white">{store.city}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-400">Kecamatan</dt>
              <dd className="font-medium text-white">{store.district}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-400">Jarak</dt>
              <dd className="font-medium text-white">{store.distanceKm} km</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-400">Rating</dt>
              <dd className="font-medium text-white">⭐ {store.rating} ({store.reviewCount} ulasan)</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">Daftar harga sembako</h2>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
              Terakhir update {store.updatedAt}
            </span>
          </div>

          <div className="space-y-3">
            {store.products.map((product) => (
              <div key={product.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                <div>
                  <p className="font-medium text-slate-100">{product.name}</p>
                  <p className="text-sm text-slate-400">{product.unit}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-300">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(product.price)}
                  </p>
                  {product.isPromo ? <p className="text-xs text-emerald-300">Promo aktif</p> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
