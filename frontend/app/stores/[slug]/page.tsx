/* eslint-disable i18next/no-literal-string */

import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { fetchStoreBySlug, fetchStores } from "@/lib/data/repository";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations("store");
  const store = await fetchStoreBySlug(slug);

  return {
    title: t("storePageTitle", { name: store?.name ?? "Toko" }),
    description: t("storePageDescription", { name: store?.name ?? "toko ini" }),
  };
}

export async function generateStaticParams() {
  const stores = await fetchStores();

  if (stores.length > 0) {
    return stores.map((store) => ({ slug: store.id }));
  }

  return [{ slug: "pasar-kranji" }, { slug: "mitra-grocery" }, { slug: "toko-rahma" }, { slug: "superindo-puri" }];
}

type StorePageProps = {
  params: Promise<{ slug: string }>;
};

async function StorePageContent({ params }: StorePageProps) {
  const { slug } = await params;
  const t = await getTranslations("store");
  const commonT = await getTranslations("common");
  const store = await fetchStoreBySlug(slug);

  if (!store) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-400">{commonT("store")}</p>
          <h1 className="mt-2 text-3xl font-bold text-white">{store.name}</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/cities" className="rounded-full border border-white/10 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:border-emerald-400">
            {commonT("backToCity")}
          </Link>
          <Link href="/" className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-500/15">
            {commonT("goToMap")}
          </Link>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">{t("infoStore")}</p>
          <dl className="mt-4 space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-400">{t("city")}</dt>
              <dd className="font-medium text-white">{store.city}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-400">{t("district")}</dt>
              <dd className="font-medium text-white">{store.district}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-400">{t("distance")}</dt>
              <dd className="font-medium text-white">{store.distanceKm} km</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-400">{t("rating")}</dt>
              <dd className="font-medium text-white">⭐ {store.rating} ({store.reviewCount} ulasan)</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">{t("priceList")}</h2>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
              {t("lastUpdated", { date: store.updatedAt })}
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
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0,
                    }).format(product.price)}
                  </p>
                  {product.isPromo ? <p className="text-xs text-emerald-300">{t("promoActive")}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default async function StorePage(props: StorePageProps) {
  const t = await getTranslations("store");

  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-300">{t("loading")}</div>}>
      <StorePageContent {...props} />
    </Suspense>
  );
}
