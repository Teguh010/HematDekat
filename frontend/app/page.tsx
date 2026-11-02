import { Suspense } from "react";

import { HomeExplorer } from "@/components/home/home-explorer";
import { listCities, listProducts, listStores } from "@/lib/data/repository";

async function HomePageContent() {
  // Do not read searchParams here. Product/city filters live in the URL and are
  // applied inside HomeExplorer so changing a category does not remount the map
  // through this Suspense boundary.
  const [products, cities, initialPage] = await Promise.all([
    listProducts(),
    listCities(),
    listStores({ limit: 50, product: "beras-premium" }),
  ]);

  return <HomeExplorer products={products} cities={cities} initialPage={initialPage} fillViewport />;
}

export default function Page() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <Suspense
        fallback={<div className="flex flex-1 items-center justify-center text-sm text-ink-500">Memuat halaman...</div>}
      >
        <HomePageContent />
      </Suspense>
    </div>
  );
}
