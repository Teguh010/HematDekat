/* eslint-disable i18next/no-literal-string */

import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { LinkCard } from "@/components/ui/link-card";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { listCities, listStores } from "@/lib/data/repository";
import { formatUnitPrice } from "@/lib/format";

async function CitiesPageContent() {
  const t = await getTranslations("city");
  const commonT = await getTranslations("common");
  const [cities, storesPage] = await Promise.all([listCities(), listStores({ limit: 100 })]);
  const stores = storesPage.items;

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        actions={
          <Button href="/" variant="secondary" size="sm">
            {commonT("backToMap")}
          </Button>
        }
      />

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((city) => {
          const cityStores = stores.filter((store) => store.city.name === city.name);
          const cheapest = [...cityStores]
            .filter((store) => store.price)
            .sort((a, b) => (a.price?.normalizedUnitPrice ?? 0) - (b.price?.normalizedUnitPrice ?? 0))[0];

          return (
            <li key={city.slug}>
              <LinkCard href={`/cities/${city.slug}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-ink-900">{city.name}</h2>
                    <p className="text-xs text-ink-500">{city.province}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-800">
                    {t("storeCount", { count: city.storeCount })}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-ink-100 pt-2">
                  <div className="min-w-0">
                    <p className="text-xs text-ink-500">{t("priceCheapest")}</p>
                    <p className="truncate text-sm text-ink-700">
                      {cheapest ? `${cheapest.price?.productName ?? "-"} · ${cheapest.name}` : commonT("notAvailable")}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-brand-700">
                    {cheapest?.price ? formatUnitPrice(cheapest.price.normalizedUnitPrice, cheapest.price.unit) : "-"}
                  </span>
                </div>
              </LinkCard>
            </li>
          );
        })}
      </ul>
    </PageContainer>
  );
}

export default async function CitiesPage() {
  const t = await getTranslations("city");

  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-ink-500">{t("loadingCities")}</div>}>
      <CitiesPageContent />
    </Suspense>
  );
}
