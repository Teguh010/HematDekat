import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { HomeExplorer } from "@/components/home/home-explorer";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
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
    <PageContainer>
      <PageHeader title={t("titleCity", { name: city.name })} description={introText} />

      <HomeExplorer
        products={products}
        cities={cities}
        initialPage={initialPage}
        lockedCity={slug}
        fillViewport={false}
      />
    </PageContainer>
  );
}

export default async function CityPage(props: CityPageProps) {
  const t = await getTranslations("city");

  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-ink-500">{t("loadingCity")}</div>}>
      <CityPageContent {...props} />
    </Suspense>
  );
}
