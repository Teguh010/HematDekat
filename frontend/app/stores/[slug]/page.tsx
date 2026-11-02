/* eslint-disable i18next/no-literal-string */

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { VoteButton } from "@/components/vote-button";
import { StoreMap } from "@/components/map/store-map";
import { Button } from "@/components/ui/button";
import { FreshnessBadge } from "@/components/ui/freshness-badge";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
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
    <PageContainer>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHeader
        title={store.name}
        description={[typeT(store.type), store.district, store.city.name].filter(Boolean).join(" · ")}
        actions={
          <>
            <Button href={store.googleMapsUrl} target="_blank" rel="noopener noreferrer" variant="secondary" size="sm">
              {t("openInGoogleMaps")}
            </Button>
            <Button href={`/report?store=${encodeURIComponent(slug)}`} size="sm">
              {t("reportThisPrice")}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <Section
            title={t("priceList")}
            action={latestPrice ? <FreshnessBadge updatedAt={latestPrice.verifiedAt} /> : null}
          >
            {store.prices.length > 0 ? (
              <ul className="divide-y divide-ink-100">
                {store.prices.map((price) => (
                  <li key={price.priceReportId} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-900">{price.productName}</p>
                      <p className="text-xs text-ink-500">
                        {formatRupiah(price.price)} / {price.quantity} {price.unit}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-right">
                      <div>
                        <p className="text-sm font-semibold text-brand-700">{formatUnitPrice(price.normalizedUnitPrice, price.unit)}</p>
                        {store.hasActivePromo ? <p className="text-xs text-brand-700">{t("promoActive")}</p> : null}
                      </div>
                      <VoteButton priceReportId={price.priceReportId} count={price.confirmationCount} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-sm text-ink-500">Belum ada harga tercatat untuk toko ini.</p>
            )}
          </Section>

          {store.promos.length > 0 ? (
            <Section title={t("promoActive")}>
              <ul className="divide-y divide-ink-100">
                {store.promos.map((promo) => (
                  <li key={promo.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-900">{promo.productName}</p>
                      <p className="text-sm text-brand-700">
                        {promo.discountPct ? `${promo.discountPct}% off` : promo.promoPrice ? formatRupiah(promo.promoPrice) : "Promo"}
                      </p>
                      {promo.conditions ? <p className="text-xs text-ink-500">{promo.conditions}</p> : null}
                      <p className="text-xs text-ink-500">
                        {promo.validFrom} – {promo.validTo}
                      </p>
                    </div>
                    <VoteButton promoId={promo.id} count={promo.confirmationCount} />
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
        </div>

        <div className="space-y-4">
          <section className="h-64 overflow-hidden rounded-xl border border-ink-200 bg-ink-100">
            <StoreMap stores={mapStores} apiKey={mapApiKey} defaultCenter={{ lat: store.lat, lng: store.lng }} defaultZoom={14} />
          </section>

          <Section title={t("infoStore")}>
            <dl className="divide-y divide-ink-100 text-sm">
              <div className="flex items-center justify-between gap-3 py-1.5">
                <dt className="text-ink-500">{t("city")}</dt>
                <dd className="font-medium text-ink-900">{store.city.name}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-1.5">
                <dt className="text-ink-500">{t("district")}</dt>
                <dd className="font-medium text-ink-900">{store.district ?? "-"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-1.5">
                <dt className="text-ink-500">{t("distance")}</dt>
                <dd className="font-medium text-ink-900">{store.hasActivePromo ? "Promo aktif" : "-"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-1.5">
                <dt className="text-ink-500">{t("rating")}</dt>
                <dd className="font-medium text-ink-900">
                  {placeDetails.available ? `★ ${Number(placeDetails.rating ?? 0).toFixed(1)} (${placeDetails.userRatingCount ?? 0} ulasan)` : "-"}
                </dd>
              </div>
            </dl>
          </Section>

          {placeDetails.available && placeDetails.photo ? (
            <section>
              {/* eslint-disable-next-line @next/next/no-img-element -- remote Google photo URL, domain not in next/image config */}
              <img
                src={placeDetails.photo.uri}
                alt={placeDetails.name}
                className="h-40 w-full rounded-xl object-cover"
                loading="lazy"
              />
              <p className="mt-1 text-xs text-ink-500">{t("placesData")}</p>
              {placeDetails.photo.attributions.length ? (
                <ul className="space-y-0.5 text-xs text-ink-500">
                  {placeDetails.photo.attributions.map((attribution) => (
                    <li key={`${attribution.displayName}-${attribution.uri ?? "no-link"}`}>
                      {attribution.uri ? (
                        <a href={attribution.uri} target="_blank" rel="noopener noreferrer" className="text-brand-700 underline underline-offset-2">
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
    </PageContainer>
  );
}

export default async function StorePage(props: StorePageProps) {
  const t = await getTranslations("store");

  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-ink-500">{t("loading")}</div>}>
      <StorePageContent {...props} />
    </Suspense>
  );
}
