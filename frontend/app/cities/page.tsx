/* eslint-disable i18next/no-literal-string */

import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { listCities, listStores } from "@/lib/data/repository";
import { formatUnitPrice } from "@/lib/format";

async function CitiesPageContent() {
  const t = await getTranslations("city");
  const commonT = await getTranslations("common");
  const [cities, storesPage] = await Promise.all([listCities(), listStores({ limit: 100 })]);
  const stores = storesPage.items;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">{t("title")}</h1>
        <Button href="/" variant="secondary" size="sm">
          {commonT("backToMap")}
        </Button>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((city) => {
          const cityStores = stores.filter((store) => store.city.name === city.name);
          const cheapest = [...cityStores]
            .filter((store) => store.price)
            .sort((a, b) => (a.price?.normalizedUnitPrice ?? 0) - (b.price?.normalizedUnitPrice ?? 0))[0];

          return (
            <li key={city.slug}>
              <Link
                href={`/cities/${city.slug}`}
                className="block rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-emerald-300 hover:bg-emerald-50/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-slate-900">{city.name}</h2>
                    <p className="text-xs text-slate-500">{city.province}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                    {t("storeCount", { count: city.storeCount })}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-2">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">{t("priceCheapest")}</p>
                    <p className="truncate text-sm text-slate-700">
                      {cheapest ? `${cheapest.price?.productName ?? "-"} · ${cheapest.name}` : commonT("notAvailable")}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-emerald-700">
                    {cheapest?.price ? formatUnitPrice(cheapest.price.normalizedUnitPrice, cheapest.price.unit) : "-"}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default async function CitiesPage() {
  const t = await getTranslations("city");

  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">{t("loadingCities")}</div>}>
      <CitiesPageContent />
    </Suspense>
  );
}
