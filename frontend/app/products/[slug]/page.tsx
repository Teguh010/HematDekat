/* eslint-disable i18next/no-literal-string */

import { Icon } from "@iconify/react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { LinkCard } from "@/components/ui/link-card";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { getProduct } from "@/lib/data/repository";
import { formatRupiah, formatUnitPrice } from "@/lib/format";
import { iconForProduct } from "@/lib/product-tones";

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
    <PageContainer>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Icon icon={iconForProduct(slug)} className="h-6 w-6 shrink-0" aria-hidden />
            {product.product.name}
          </span>
        }
        actions={
          <Button href="/" variant="secondary" size="sm">
            {commonT("backToMap")}
          </Button>
        }
      />

      <Card as="section" className="mb-4">
        <div className="mb-3 flex flex-wrap gap-2">
          <Chip href={`/products/${slug}`} active={!selectedCity}>
            Semua kota
          </Chip>
          {product.cityAverages.map((city) => (
            <Chip
              key={city.citySlug}
              href={`/products/${slug}?city=${encodeURIComponent(city.citySlug)}`}
              active={selectedCity === city.citySlug}
            >
              {city.cityName}
            </Chip>
          ))}
        </div>

        <div className="overflow-x-auto rounded-lg border border-ink-200">
          <table className="min-w-full text-left text-sm text-ink-700">
            <thead className="bg-ink-50 text-ink-500">
              <tr>
                <th className="px-3 py-2 font-medium">Kota</th>
                <th className="px-3 py-2 font-medium">Rata-rata</th>
                <th className="px-3 py-2 font-medium">Laporan</th>
              </tr>
            </thead>
            <tbody>
              {product.cityAverages.map((city) => (
                <tr key={city.citySlug} className="border-t border-ink-100">
                  <td className="px-3 py-2">
                    <Link
                      href={`/products/${slug}?city=${encodeURIComponent(city.citySlug)}`}
                      className="font-medium text-ink-900 hover:text-brand-700"
                    >
                      {city.cityName}
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-medium text-brand-700">{formatRupiah(city.averageUnitPrice)}</td>
                  <td className="px-3 py-2 text-ink-500">{city.reportCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {product.cheapest.map((store) => (
          <li key={store.id}>
            <LinkCard href={`/stores/${store.slug}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-ink-900">{store.name}</h2>
                  <p className="text-xs text-ink-500">{store.city.name}</p>
                </div>
                <span className="shrink-0 rounded-full border border-ink-200 bg-ink-50 px-2 py-0.5 text-xs text-ink-600">
                  {store.distanceKm ?? 0} km
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between gap-3 border-t border-ink-100 pt-2">
                <span className="truncate text-xs text-ink-500">{t("price")}</span>
                <span className="shrink-0 text-sm font-semibold text-brand-700">
                  {store.price ? formatUnitPrice(store.price.normalizedUnitPrice, store.price.unit) : formatRupiah(0)}
                </span>
              </div>
            </LinkCard>
          </li>
        ))}
      </ul>
    </PageContainer>
  );
}

export default async function ProductPage(props: ProductPageProps) {
  const t = await getTranslations("product");

  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-ink-500">{t("loadingProduct")}</div>}>
      <ProductPageContent {...props} />
    </Suspense>
  );
}
