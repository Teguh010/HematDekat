/* eslint-disable i18next/no-literal-string */

import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { fetchCities, fetchStores } from "@/lib/data/repository";
import { formatRupiah } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations("city");

  return {
    title: t("cityPageTitle", {
      name: slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    }),
    description: t("cityPageDescription", { name: slug.replace(/-/g, " ") }),
  };
}

export async function generateStaticParams() {
  const cities = await fetchCities();

  if (cities.length > 0) {
    return cities.map((city) => ({ slug: city.slug }));
  }

  return [{ slug: "jakarta" }, { slug: "bandung" }, { slug: "surabaya" }];
}

type CityPageProps = {
  params: Promise<{ slug: string }>;
};

async function CityPageContent({ params }: CityPageProps) {
  const { slug } = await params;
  const t = await getTranslations("city");
  const commonT = await getTranslations("common");
  const cityName = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const stores = await fetchStores();
  const cityStores = stores.filter((store) => {
    const storeSlug = store.city.toLowerCase().replace(/\s+/g, "-");
    return storeSlug === slug;
  });

  if (cityStores.length === 0) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-400">{commonT("city")}</p>
          <h1 className="mt-2 text-3xl font-bold text-white">{cityName}</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/cities" className="rounded-full border border-white/10 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:border-emerald-400">
            {t("allCities")}
          </Link>
          <Link href="/" className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-500/15">
            {commonT("goToMap")}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cityStores.map((store) => {
          const cheapestProduct = store.products.length > 0 ? [...store.products].sort((a, b) => a.price - b.price)[0] : null;

          return (
            <Link
              key={store.id}
              href={`/stores/${store.id}`}
              className="rounded-3xl border border-white/10 bg-slate-900 p-5 transition hover:border-emerald-400/60 hover:bg-slate-800"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{store.type}</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">{store.name}</h2>
                </div>
                <span className="rounded-full border border-white/10 bg-slate-800 px-2 py-1 text-xs text-slate-300">
                  {store.distanceKm} km
                </span>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t("priceFrom")}</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-200">{cheapestProduct?.name ?? "-"}</p>
                    <p className="text-sm text-slate-400">{store.district}</p>
                  </div>
                  <span className="text-lg font-bold text-emerald-300">
                    {cheapestProduct ? formatRupiah(cheapestProduct.price) : "-"}
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

export default async function CityPage(props: CityPageProps) {
  const t = await getTranslations("city");

  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-300">{t("loadingCity")}</div>}>
      <CityPageContent {...props} />
    </Suspense>
  );
}
