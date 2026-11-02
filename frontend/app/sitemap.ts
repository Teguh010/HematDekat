import type { MetadataRoute } from "next";

import { listCities, listProducts, listStores } from "@/lib/data/repository";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const staticEntries: MetadataRoute.Sitemap = [
    "",
    "/about",
    "/privacy",
    "/terms",
    "/feedback",
    "/cities",
    "/report",
    "/login",
    "/register",
  ].map((path) => ({
    url: new URL(path, siteUrl).toString(),
    lastModified: new Date(),
  }));

  try {
    const [cities, products, storePage] = await Promise.all([
      listCities(),
      listProducts(),
      listStores({ limit: 500 }),
    ]);

    const dynamicEntries: MetadataRoute.Sitemap = [
      ...cities.map((city) => ({
        url: new URL(`/cities/${city.slug}`, siteUrl).toString(),
        lastModified: new Date(),
      })),
      ...products.map((product) => ({
        url: new URL(`/products/${product.slug}`, siteUrl).toString(),
        lastModified: new Date(),
      })),
      ...storePage.items.map((store) => ({
        url: new URL(`/stores/${store.slug}`, siteUrl).toString(),
        lastModified: new Date(),
      })),
    ];

    return [...staticEntries, ...dynamicEntries];
  } catch {
    return staticEntries;
  }
}
