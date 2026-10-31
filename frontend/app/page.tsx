import { Suspense } from "react";

import { HomeExplorer } from "@/components/home/home-explorer";
import { listCities, listProducts, listStores } from "@/lib/data/repository";

type HomePageParams = Record<string, string | string[] | undefined>;

async function HomePageContent({ searchParams }: { searchParams: Promise<HomePageParams> }) {
  const params = await searchParams;

  const [products, cities, initialPage] = await Promise.all([
    listProducts(),
    listCities(),
    listStores({ limit: 20, product: Array.isArray(params.product) ? params.product[0] : params.product }),
  ]);

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
