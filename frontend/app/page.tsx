import { Suspense } from "react";

import { HomeExplorer } from "@/components/home/home-explorer";
import { listCities, listProducts, listStores } from "@/lib/data/repository";

type HomePageParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function HomePageContent({ searchParams }: { searchParams: Promise<HomePageParams> }) {
  const params = await searchParams;
  const [products, cities] = await Promise.all([listProducts(), listCities()]);

  const requestedProduct = firstParam(params.product);
  const product =
    requestedProduct && products.some((item) => item.slug === requestedProduct)
      ? requestedProduct
      : (products[0]?.slug ?? "beras-premium");

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
