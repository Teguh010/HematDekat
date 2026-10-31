import type { City, Page, PriceSummary, Product, StoreDetail, StoreSummary } from "@/lib/data/types";

export const cityFixture: City = {
  slug: "jakarta",
  name: "Jakarta",
  province: "DKI Jakarta",
  centerLat: -6.2088,
  centerLng: 106.8456,
  storeCount: 3,
};

export const productFixture: Product = {
  slug: "beras-premium",
  name: "Beras Premium",
  category: "rice",
  defaultUnit: "kg",
};

export const priceSummaryFixture: PriceSummary = {
  priceReportId: "pr_1",
  productSlug: "beras-premium",
  productName: "Beras Premium",
  unit: "kg",
  price: 14000,
  quantity: 1,
  normalizedUnitPrice: 14000,
  verifiedAt: "2025-01-01T00:00:00.000Z",
  confirmationCount: 2,
};

export const storeSummaryFixture: StoreSummary = {
  id: "store-1",
  slug: "toko-anyar",
  name: "Toko Anyar",
  type: "market",
  city: { slug: "jakarta", name: "Jakarta" },
  district: "Menteng",
  lat: -6.2088,
  lng: 106.8456,
  distanceKm: 1.2,
  price: priceSummaryFixture,
  hasActivePromo: true,
};

export const storeDetailFixture: StoreDetail = {
  ...storeSummaryFixture,
  placeId: "place-1",
  prices: [priceSummaryFixture],
  promos: [],
  googleMapsUrl: "https://maps.google.com/?q=Toko+Anyar",
};

export const storesPageFixture: Page<StoreSummary> = {
  items: [storeSummaryFixture],
  total: 1,
  offset: 0,
  limit: 20,
};
