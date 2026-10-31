/* eslint-disable i18next/no-literal-string */

import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getProduct, listProducts } from "@/lib/data/repository";
import { formatRupiah } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations("product");
  const product = await getProduct(slug).catch(() => null);

  return {
    title: t("productPageTitle", { name: product?.product.name ?? "Produk" }),
    description: t("productPageDescription", { name: product?.product.name ?? "produk" }),
  };
}

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

async function ProductPageContent({ params }: ProductPageProps) {
  const { slug } = await params;
  const t = await getTranslations("product");
  const commonT = await getTranslations("common");
  const product = await getProduct(slug).catch(() => null);

  if (!product) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-400">{commonT("product")}</p>
          <h1 className="mt-2 text-3xl font-bold text-white">{product.product.name}</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/" className="rounded-full border border-white/10 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:border-emerald-400">
            {commonT("backToMap")}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {product.cheapest.map((store) => (
          <Link
            key={store.id}
            href={`/stores/${store.slug}`}
            className="rounded-3xl border border-white/10 bg-slate-900 p-5 transition hover:border-emerald-400/60 hover:bg-slate-800"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{store.city.name}</p>
                <h2 className="mt-2 text-xl font-semibold text-white">{store.name}</h2>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                {store.distanceKm ?? 0} km
              </span>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/50 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t("price")}</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-300">{product.product.name}</span>
                <span className="text-lg font-bold text-emerald-300">{formatRupiah(store.price?.normalizedUnitPrice ?? 0)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

export default async function ProductPage(props: ProductPageProps) {
  const t = await getTranslations("product");

  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-300">{t("loadingProduct")}</div>}>
      <ProductPageContent {...props} />
    </Suspense>
  );
}
