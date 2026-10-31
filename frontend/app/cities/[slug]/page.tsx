/* eslint-disable i18next/no-literal-string */

import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getCity, listCities, listStores } from "@/lib/data/repository";
import { formatRupiah } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations("city");
  const city = await getCity(slug).catch(() => null);

  return {
    title: t("cityPageTitle", {
      name: city?.name ?? slug.replace(/-/g, " "),
    }),
    description: t("cityPageDescription", { name: city?.name ?? slug.replace(/-/g, " ") }),
  };
}

type CityPageProps = {
  params: Promise<{ slug: string }>;
};

async function CityPageContent({ params }: CityPageProps) {
  const { slug } = await params;
  const t = await getTranslations("city");
  const commonT = await getTranslations("common");
  const city = await getCity(slug).catch(() => null);

  if (!city) {
    notFound();
  }

  const storesPage = await listStores({ city: slug, limit: 100 });
  const cityStores = storesPage.items;

  if (cityStores.length === 0) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-400">{commonT("city")}</p>
          <h1 className="mt-2 text-3xl font-bold text-white">{city.name}</h1>
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
          const cheapestPrice = store.price?.normalizedUnitPrice ?? 0;

          return (
            <Link
              key={store.id}
              href={`/stores/${store.slug}`}
              className="rounded-3xl border border-white/10 bg-slate-900 p-5 transition hover:border-emerald-400/60 hover:bg-slate-800"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{store.type}</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">{store.name}</h2>
                </div>
                <span className="rounded-full border border-white/10 bg-slate-800 px-2 py-1 text-xs text-slate-300">
                  {store.distanceKm ?? 0} km
                </span>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t("priceFrom")}</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-200">{store.price?.productName ?? "-"}</p>
                    <p className="text-sm text-slate-400">{store.district ?? "-"}</p>
                  </div>
                  <span className="text-lg font-bold text-emerald-300">{formatRupiah(cheapestPrice)}</span>
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
