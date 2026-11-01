/* eslint-disable i18next/no-literal-string */

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { HomeExplorer } from "@/components/home/home-explorer";
import { getCity, listCities, listProducts, listStores } from "@/lib/data/repository";

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
  const city = await getCity(slug).catch(() => null);

  if (!city) {
    notFound();
  }

  const [products, cities, initialPage] = await Promise.all([
    listProducts(),
    listCities(),
    listStores({ city: slug, limit: 50, product: "beras-premium" }),
  ]);

  const introKey = `intro.${slug}` as const;
  const introText = t.has(introKey) ? t(introKey) : t("introFallback");

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">{t("cityLabel")}</p>
        <h1 className="mt-2 text-3xl font-bold text-white">{t("titleCity", { name: city.name })}</h1>
        <p className="mt-3 max-w-3xl text-base text-slate-300">{introText}</p>
      </div>

      <HomeExplorer products={products} cities={cities} initialPage={initialPage} params={{ city: slug }} lockedCity={slug} />
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
