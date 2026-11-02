/* eslint-disable i18next/no-literal-string */

import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getProduct } from "@/lib/data/repository";
import { formatRupiah, formatUnitPrice } from "@/lib/format";

const chipBase =
  "inline-flex h-8 items-center rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600";
const chipActive = "bg-emerald-600 text-white";
const chipIdle = "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50";

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations("product");
  const product = await getProduct(slug).catch(() => null);

  return {
    title: t("productPageTitle", { name: product?.product.name ?? "Produk" }),
    description: t("productPageDescription", { name: product?.product.name ?? "produk" }),
  };
}

type ProductPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function ProductPageContent({ params, searchParams }: ProductPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const selectedCity = firstParam(query.city);
  const t = await getTranslations("product");
  const commonT = await getTranslations("common");
  const product = await getProduct(slug, selectedCity).catch(() => null);

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">{product.product.name}</h1>
        <Button href="/" variant="secondary" size="sm">
          {commonT("backToMap")}
        </Button>
      </div>

      <Card as="section" className="mb-4">
        <div className="mb-3 flex flex-wrap gap-2">
          <Link
            href={`/products/${slug}`}
            className={`${chipBase} ${!selectedCity ? chipActive : chipIdle}`}
          >
            Semua kota
          </Link>
          {product.cityAverages.map((city) => (
            <Link
              key={city.citySlug}
              href={`/products/${slug}?city=${encodeURIComponent(city.citySlug)}`}
              className={`${chipBase} ${selectedCity === city.citySlug ? chipActive : chipIdle}`}
            >
              {city.cityName}
            </Link>
          ))}
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Kota</th>
                <th className="px-3 py-2 font-medium">Rata-rata</th>
                <th className="px-3 py-2 font-medium">Laporan</th>
              </tr>
            </thead>
            <tbody>
              {product.cityAverages.map((city) => (
                <tr key={city.citySlug} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <Link
                      href={`/products/${slug}?city=${encodeURIComponent(city.citySlug)}`}
                      className="font-medium text-slate-900 hover:text-emerald-700"
                    >
                      {city.cityName}
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-medium text-emerald-700">{formatRupiah(city.averageUnitPrice)}</td>
                  <td className="px-3 py-2 text-slate-500">{city.reportCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {product.cheapest.map((store) => (
          <li key={store.id}>
            <Link
              href={`/stores/${store.slug}`}
              className="block rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-emerald-300 hover:bg-emerald-50/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-slate-900">{store.name}</h2>
                  <p className="text-xs text-slate-500">{store.city.name}</p>
                </div>
                <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                  {store.distanceKm ?? 0} km
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-100 pt-2">
                <span className="truncate text-xs text-slate-500">{t("price")}</span>
                <span className="shrink-0 text-sm font-semibold text-emerald-700">
                  {store.price ? formatUnitPrice(store.price.normalizedUnitPrice, store.price.unit) : formatRupiah(0)}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function ProductPage(props: ProductPageProps) {
  const t = await getTranslations("product");

  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">{t("loadingProduct")}</div>}>
      <ProductPageContent {...props} />
    </Suspense>
  );
}
