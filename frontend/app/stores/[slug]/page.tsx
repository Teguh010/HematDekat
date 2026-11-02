/* eslint-disable i18next/no-literal-string */

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { VoteButton } from "@/components/vote-button";
import { StoreMap } from "@/components/map/store-map";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FreshnessBadge } from "@/components/ui/freshness-badge";
import { getStore, getStorePlaceDetails } from "@/lib/data/repository";
import type { StoreSummary } from "@/lib/data/types";
import { formatRupiah, formatUnitPrice } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations("store");
  const store = await getStore(slug).catch(() => null);

  return {
    title: t("storePageTitle", { name: store?.name ?? "Toko" }),
    description: t("storePageDescription", { name: store?.name ?? "toko ini" }),
  };
}

type StorePageProps = {
  params: Promise<{ slug: string }>;
};

async function StorePageContent({ params }: StorePageProps) {
  const { slug } = await params;
  const t = await getTranslations("store");
  const typeT = await getTranslations("storeType");
  const store = await getStore(slug).catch(() => null);

  if (!store) {
    notFound();
  }

  const placeDetails = await getStorePlaceDetails(slug).catch(() => ({ available: false } as const));
  const latestPrice = store.prices[0] ?? null;
  const mapStores: StoreSummary[] = [
    {
      id: store.id,
      slug: store.slug,
      name: store.name,
      type: store.type,
      city: store.city,
      district: store.district,
      lat: store.lat,
      lng: store.lng,
      distanceKm: null,
      price: latestPrice ?? null,
      hasActivePromo: store.hasActivePromo,
    },
  ];
  const mapApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "GroceryStore",
    name: store.name,
    description: t("storePageDescription", { name: store.name }),
    image: placeDetails.available && placeDetails.photo ? placeDetails.photo.uri : undefined,
    address: {
      "@type": "PostalAddress",
      addressCountry: "ID",
      addressLocality: store.city.name,
      streetAddress: placeDetails.available && placeDetails.formattedAddress ? placeDetails.formattedAddress : undefined,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: store.lat,
      longitude: store.lng,
    },
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/stores/${encodeURIComponent(store.slug)}`,
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-slate-900">{store.name}</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {[typeT(store.type), store.district, store.city.name].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button href={store.googleMapsUrl} target="_blank" rel="noopener noreferrer" variant="secondary" size="sm">
            {t("openInGoogleMaps")}
          </Button>
          <Button href={`/report?store=${encodeURIComponent(slug)}`} size="sm">
            {t("reportThisPrice")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <Card as="section">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">{t("priceList")}</h2>
              {latestPrice ? <FreshnessBadge updatedAt={latestPrice.verifiedAt} /> : null}
            </div>

            {store.prices.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {store.prices.map((price) => (
                  <li key={price.priceReportId} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{price.productName}</p>
                      <p className="text-xs text-slate-500">
                        {formatRupiah(price.price)} / {price.quantity} {price.unit}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-right">
                      <div>
                        <p className="text-sm font-semibold text-emerald-700">{formatUnitPrice(price.normalizedUnitPrice, price.unit)}</p>
                        {store.hasActivePromo ? <p className="text-xs text-emerald-700">{t("promoActive")}</p> : null}
                      </div>
                      <VoteButton priceReportId={price.priceReportId} count={price.confirmationCount} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-sm text-slate-500">Belum ada harga tercatat untuk toko ini.</p>
            )}
          </Card>

          {store.promos.length > 0 ? (
            <Card as="section">
              <h2 className="mb-2 text-base font-semibold text-slate-900">{t("promoActive")}</h2>
              <ul className="divide-y divide-slate-100">
                {store.promos.map((promo) => (
                  <li key={promo.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{promo.productName}</p>
                      <p className="text-sm text-emerald-700">
                        {promo.discountPct ? `${promo.discountPct}% off` : promo.promoPrice ? formatRupiah(promo.promoPrice) : "Promo"}
                      </p>
                      {promo.conditions ? <p className="text-xs text-slate-500">{promo.conditions}</p> : null}
                      <p className="text-xs text-slate-500">
                        {promo.validFrom} – {promo.validTo}
                      </p>
                    </div>
                    <VoteButton promoId={promo.id} count={promo.confirmationCount} />
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <section className="h-64 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            <StoreMap stores={mapStores} apiKey={mapApiKey} defaultCenter={{ lat: store.lat, lng: store.lng }} defaultZoom={14} />
          </section>

          <Card as="section">
            <h2 className="mb-2 text-base font-semibold text-slate-900">{t("infoStore")}</h2>
            <dl className="divide-y divide-slate-100 text-sm">
              <div className="flex items-center justify-between gap-3 py-1.5">
                <dt className="text-slate-500">{t("city")}</dt>
                <dd className="font-medium text-slate-900">{store.city.name}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-1.5">
                <dt className="text-slate-500">{t("district")}</dt>
                <dd className="font-medium text-slate-900">{store.district ?? "-"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-1.5">
                <dt className="text-slate-500">{t("distance")}</dt>
                <dd className="font-medium text-slate-900">{store.hasActivePromo ? "Promo aktif" : "-"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-1.5">
                <dt className="text-slate-500">{t("rating")}</dt>
                <dd className="font-medium text-slate-900">
                  {placeDetails.available ? `★ ${Number(placeDetails.rating ?? 0).toFixed(1)} (${placeDetails.userRatingCount ?? 0} ulasan)` : "-"}
                </dd>
              </div>
            </dl>
          </Card>

          {placeDetails.available && placeDetails.photo ? (
            <section>
              {/* eslint-disable-next-line @next/next/no-img-element -- remote Google photo URL, domain not in next/image config */}
              <img
                src={placeDetails.photo.uri}
                alt={placeDetails.name}
                className="h-40 w-full rounded-xl object-cover"
                loading="lazy"
              />
              <p className="mt-1 text-xs text-slate-500">{t("placesData")}</p>
              {placeDetails.photo.attributions.length ? (
                <ul className="space-y-0.5 text-xs text-slate-500">
                  {placeDetails.photo.attributions.map((attribution) => (
                    <li key={`${attribution.displayName}-${attribution.uri ?? "no-link"}`}>
                      {attribution.uri ? (
                        <a href={attribution.uri} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline underline-offset-2">
                          {attribution.displayName}
                        </a>
                      ) : (
                        attribution.displayName
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default async function StorePage(props: StorePageProps) {
  const t = await getTranslations("store");

  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">{t("loading")}</div>}>
      <StorePageContent {...props} />
    </Suspense>
  );
}
