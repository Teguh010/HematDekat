import Link from "next/link";
import { notFound } from "next/navigation";

import { getProductBySlug, getProductNames } from "@/lib/data/repository";

export function generateStaticParams() {
  return getProductNames().map((name) => ({ slug: name.toLowerCase().replace(/\s+/g, "-") }));
}

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-400">Produk</p>
          <h1 className="mt-2 text-3xl font-bold text-white">{product.name}</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/" className="rounded-full border border-white/10 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:border-emerald-400">
            Kembali ke peta
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {product.stores.map((store) => (
          <Link
            key={store.id}
            href={`/stores/${store.id}`}
            className="rounded-3xl border border-white/10 bg-slate-900 p-5 transition hover:border-emerald-400/60 hover:bg-slate-800"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{store.city}</p>
                <h2 className="mt-2 text-xl font-semibold text-white">{store.name}</h2>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                {store.distanceKm} km
              </span>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/50 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Harga</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-300">{store.product?.name ?? product.name}</span>
                <span className="text-lg font-bold text-emerald-300">
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
                    store.product?.normalizedUnitPrice ?? 0,
                  )}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
