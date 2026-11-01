import { Suspense } from "react";

import { HomeExplorer } from "@/components/home/home-explorer";
import { listCities, listProducts, listStores } from "@/lib/data/repository";
import { parseSearchParams } from "@/lib/search-params";

type HomePageParams = Record<string, string | string[] | undefined>;

async function HomePageContent({ searchParams }: { searchParams: Promise<HomePageParams> }) {
  const params = await searchParams;
  const [products, cities] = await Promise.all([listProducts(), listCities()]);
  const parsed = parseSearchParams(params);

  // Must match home-explorer's activeProduct (parseSearchParams defaults to beras-premium).
  // Using products[0] here previously fetched ayam-broiler while the UI filtered for beras-premium.
  const product =
    parsed.product && products.some((item) => item.slug === parsed.product)
      ? parsed.product
      : (products.find((item) => item.slug === "beras-premium")?.slug ?? products[0]?.slug ?? "beras-premium");

  const initialPage = await listStores({ limit: 50, product });

  return <HomeExplorer products={products} cities={cities} initialPage={initialPage} params={params} />;
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<HomePageParams>;
}) {
  return (
    <Suspense
      fallback={<div className="flex min-h-[50vh] items-center justify-center text-slate-300">Memuat halaman...</div>}
    >
      <HomePageContent searchParams={searchParams} />
    </Suspense>
  );
}
