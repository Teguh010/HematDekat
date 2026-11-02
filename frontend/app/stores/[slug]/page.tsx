/* eslint-disable i18next/no-literal-string */

import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { VoteButton } from "@/components/vote-button";
import { StoreMap } from "@/components/store-map";
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
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">{store.type}</p>
          <h1 className="mt-2 text-3xl font-bold text-white">{store.name}</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={store.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/10 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:border-emerald-400"
          >
            {t("openInGoogleMaps")}
          </Link>
          <Link
            href={`/report?store=${encodeURIComponent(slug)}`}
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            {t("reportThisPrice")}
          </Link>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900 p-5">
          <p className="text-sm font-medium text-slate-400">{t("infoStore")}</p>
          <dl className="mt-4 space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-400">{t("city")}</dt>
              <dd className="font-medium text-white">{store.city.name}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-400">{t("district")}</dt>
              <dd className="font-medium text-white">{store.district ?? "-"}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-400">{t("distance")}</dt>
              <dd className="font-medium text-white">{store.hasActivePromo ? "Promo aktif" : "-"}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-400">{t("rating")}</dt>
              <dd className="font-medium text-white">
                {placeDetails.available ? `★ ${Number(placeDetails.rating ?? 0).toFixed(1)} (${placeDetails.userRatingCount ?? 0} ulasan)` : "-"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">{t("priceList")}</h2>
            {latestPrice ? <FreshnessBadge updatedAt={latestPrice.verifiedAt} className="text-[8px]" /> : null}
          </div>

          <div className="space-y-3">
            {store.prices.length > 0 ? (
              store.prices.map((price) => (
                <div key={price.priceReportId} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                  <div>
                    <p className="font-medium text-white">{price.productName}</p>
                    <p className="text-sm text-slate-400">
                      {price.quantity} {price.unit} · {formatUnitPrice(price.normalizedUnitPrice, price.unit)}
                    </p>
                  </div>
                  <div className="flex items-start gap-3 text-right">
                    <div>
                      <p className="text-lg font-bold text-emerald-300">{formatRupiah(price.normalizedUnitPrice)}</p>
                      {store.hasActivePromo ? <p className="text-xs text-emerald-300">{t("promoActive")}</p> : null}
                    </div>
                    <VoteButton priceReportId={price.priceReportId} count={price.confirmationCount} className="mt-0.5" />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-6 text-center text-sm text-slate-400">
                Belum ada harga tercatat untuk toko ini.
              </div>
            )}
          </div>
        </div>
      </section>

      {store.promos.length > 0 ? (
        <section className="mt-6 rounded-3xl border border-white/10 bg-slate-900 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">{t("promoActive")}</h2>
          </div>

          <div className="space-y-3">
            {store.promos.map((promo) => (
              <div key={promo.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                <div>
                  <p className="font-medium text-white">{promo.productName}</p>
                  <p className="text-sm text-slate-400">
                    {promo.discountPct ? `${promo.discountPct}% off` : promo.promoPrice ? formatRupiah(promo.promoPrice) : "Promo"}
                  </p>
                  {promo.conditions ? <p className="mt-1 text-xs text-slate-400">{promo.conditions}</p> : null}
                  <p className="mt-1 text-xs text-slate-500">
                    {promo.validFrom} – {promo.validTo}
                  </p>
                </div>
                <VoteButton promoId={promo.id} count={promo.confirmationCount} className="mt-0.5" />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-slate-900">
        <div className="h-60 w-full">
          <StoreMap stores={mapStores} apiKey={mapApiKey} defaultCenter={{ lat: store.lat, lng: store.lng }} defaultZoom={14} />
        </div>
      </section>

      {placeDetails.available ? (
        <section className="mt-6 rounded-3xl border border-white/10 bg-slate-900 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-400">{t("rating")}</p>
              <p className="mt-1 text-lg font-semibold text-white">
                ★ {Number(placeDetails.rating ?? 0).toFixed(1)} ({placeDetails.userRatingCount ?? 0} ulasan)
              </p>
            </div>
            {placeDetails.photo ? (
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{t("placesData")}</span>
            ) : null}
          </div>

          {placeDetails.photo ? (
            <img
              src={placeDetails.photo.uri}
              alt={placeDetails.name}
              className="mb-4 h-56 w-full rounded-2xl object-cover"
              loading="lazy"
            />
          ) : null}

          {placeDetails.photo?.attributions.length ? (
            <ul className="mt-2 space-y-1 text-xs text-slate-400">
              {placeDetails.photo.attributions.map((attribution) => (
                <li key={`${attribution.displayName}-${attribution.uri ?? "no-link"}`}>
                  {attribution.uri ? (
                    <a href={attribution.uri} target="_blank" rel="noopener noreferrer" className="text-emerald-300 underline decoration-emerald-400/60 underline-offset-2">
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
    </main>
  );
}

export default async function StorePage(props: StorePageProps) {
  const t = await getTranslations("store");

  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-300">{t("loading")}</div>}>
      <StorePageContent {...props} />
    </Suspense>
  );
}
