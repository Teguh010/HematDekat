import { z } from "zod";

import { apiFetch } from "../api-client";

export type StoreType = "supermarket" | "minimarket" | "market" | "grocery-stall";

export interface ProductPrice {
  id: string;
  name: string;
  category: "rice" | "oil" | "sugar" | "eggs" | "flour" | "seasoning" | "proteins";
  unit: "kg" | "liter" | "pcs" | "pack";
  price: number;
  normalizedUnitPrice: number;
  isPromo: boolean;
}

export interface Store {
  id: string;
  name: string;
  city: string;
  district: string;
  type: StoreType;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  updatedAt: string;
  coordinates: {
    x: number;
    y: number;
    lat: number;
    lng: number;
  };
  products: ProductPrice[];
}

export interface StoreWithProduct extends Store {
  product?: ProductPrice;
}

export interface CitySummary {
  slug: string;
  name: string;
  province: string;
  storeCount: number;
}

const backendStoreSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  name: z.string().optional(),
  city: z.union([z.string(), z.object({ name: z.string().optional() })]).optional(),
  district: z.string().optional(),
  address: z.string().optional(),
  type: z.enum(["supermarket", "minimarket", "market", "grocery-stall"]).optional(),
  rating: z.number().optional(),
  reviewCount: z.number().optional(),
  distanceKm: z.number().optional(),
  updatedAt: z.string().optional(),
  coordinates: z
    .object({
      x: z.number().optional(),
      y: z.number().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
    })
    .optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  products: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().optional(),
        category: z.string().optional(),
        unit: z.string().optional(),
        price: z.number().optional(),
        normalizedUnitPrice: z.number().optional(),
        isPromo: z.boolean().optional(),
      }),
    )
    .optional(),
  priceReports: z
    .array(
      z.object({
        id: z.string().optional(),
        price: z.number().optional(),
        normalizedUnitPrice: z.number().optional(),
        status: z.string().optional(),
        isPromo: z.boolean().optional(),
        unit: z.union([z.string(), z.undefined()]).optional(),
        product: z
          .object({
            id: z.string().optional(),
            slug: z.string().optional(),
            name: z.string().optional(),
            category: z.string().optional(),
            defaultUnit: z.string().optional(),
          })
          .optional(),
      }),
    )
    .optional(),
});

const backendCitySchema = z.object({
  slug: z.string().optional(),
  name: z.string().optional(),
  province: z.string().optional(),
  storeCount: z.number().optional(),
});

const mockStores: Store[] = [
  {
    id: "pasar-kranji",
    name: "Pasar Kramat Jati",
    city: "Jakarta",
    district: "Kramat Jati",
    type: "market",
    rating: 4.7,
    reviewCount: 401,
    distanceKm: 2.4,
    updatedAt: "2 jam yang lalu",
    coordinates: { x: 30, y: 42, lat: -6.287, lng: 106.856 },
    products: [
      { id: "rice-1", name: "Beras premium", category: "rice", unit: "kg", price: 15000, normalizedUnitPrice: 15000, isPromo: false },
      { id: "oil-1", name: "Minyak goreng curah", category: "oil", unit: "liter", price: 17000, normalizedUnitPrice: 17000, isPromo: true },
      { id: "sugar-1", name: "Gula pasir", category: "sugar", unit: "kg", price: 15000, normalizedUnitPrice: 15000, isPromo: false },
      { id: "egg-1", name: "Telur ayam", category: "eggs", unit: "pcs", price: 2900, normalizedUnitPrice: 2900, isPromo: false },
    ],
  },
  {
    id: "mitra-grocery",
    name: "Mitra Grocery",
    city: "Jakarta",
    district: "Cakung",
    type: "minimarket",
    rating: 4.5,
    reviewCount: 168,
    distanceKm: 4.1,
    updatedAt: "1 hari yang lalu",
    coordinates: { x: 58, y: 62, lat: -6.196, lng: 106.96 },
    products: [
      { id: "rice-2", name: "Beras premium", category: "rice", unit: "kg", price: 15500, normalizedUnitPrice: 15500, isPromo: false },
      { id: "oil-2", name: "Minyak goreng curah", category: "oil", unit: "liter", price: 16500, normalizedUnitPrice: 16500, isPromo: true },
      { id: "flour-1", name: "Tepung terigu", category: "flour", unit: "kg", price: 12000, normalizedUnitPrice: 12000, isPromo: false },
      { id: "egg-2", name: "Telur ayam", category: "eggs", unit: "pcs", price: 3000, normalizedUnitPrice: 3000, isPromo: false },
    ],
  },
  {
    id: "toko-rahma",
    name: "Toko Rahma",
    city: "Bandung",
    district: "Bandung Kulon",
    type: "grocery-stall",
    rating: 4.6,
    reviewCount: 213,
    distanceKm: 3.2,
    updatedAt: "4 jam yang lalu",
    coordinates: { x: 48, y: 30, lat: -6.906, lng: 107.565 },
    products: [
      { id: "rice-3", name: "Beras premium", category: "rice", unit: "kg", price: 14900, normalizedUnitPrice: 14900, isPromo: false },
      { id: "oil-3", name: "Minyak goreng curah", category: "oil", unit: "liter", price: 16800, normalizedUnitPrice: 16800, isPromo: false },
      { id: "sugar-2", name: "Gula pasir", category: "sugar", unit: "kg", price: 14500, normalizedUnitPrice: 14500, isPromo: true },
      { id: "egg-3", name: "Telur ayam", category: "eggs", unit: "pcs", price: 2800, normalizedUnitPrice: 2800, isPromo: true },
    ],
  },
  {
    id: "pasar-sukajadi",
    name: "Pasar Sukajadi",
    city: "Bandung",
    district: "Sukajadi",
    type: "market",
    rating: 4.8,
    reviewCount: 527,
    distanceKm: 1.5,
    updatedAt: "30 menit yang lalu",
    coordinates: { x: 68, y: 46, lat: -6.885, lng: 107.6 },
    products: [
      { id: "rice-4", name: "Beras premium", category: "rice", unit: "kg", price: 14700, normalizedUnitPrice: 14700, isPromo: true },
      { id: "oil-4", name: "Minyak goreng curah", category: "oil", unit: "liter", price: 16000, normalizedUnitPrice: 16000, isPromo: true },
      { id: "flour-2", name: "Tepung terigu", category: "flour", unit: "kg", price: 11800, normalizedUnitPrice: 11800, isPromo: false },
      { id: "egg-4", name: "Telur ayam", category: "eggs", unit: "pcs", price: 2750, normalizedUnitPrice: 2750, isPromo: true },
    ],
  },
  {
    id: "superindo-puri",
    name: "Super Indo Puri",
    city: "Surabaya",
    district: "Wiyung",
    type: "supermarket",
    rating: 4.4,
    reviewCount: 278,
    distanceKm: 6.3,
    updatedAt: "6 jam yang lalu",
    coordinates: { x: 73, y: 72, lat: -7.324, lng: 112.709 },
    products: [
      { id: "rice-5", name: "Beras premium", category: "rice", unit: "kg", price: 16200, normalizedUnitPrice: 16200, isPromo: false },
      { id: "oil-5", name: "Minyak goreng curah", category: "oil", unit: "liter", price: 17500, normalizedUnitPrice: 17500, isPromo: false },
      { id: "sugar-3", name: "Gula pasir", category: "sugar", unit: "kg", price: 16000, normalizedUnitPrice: 16000, isPromo: false },
      { id: "egg-5", name: "Telur ayam", category: "eggs", unit: "pcs", price: 3100, normalizedUnitPrice: 3100, isPromo: false },
    ],
  },
];

let storeCache: Store[] | null = null;
let cityCache: CitySummary[] | null = null;

function normalizeProductCategory(value: string | undefined): ProductPrice["category"] {
  switch (String(value ?? "").toUpperCase()) {
    case "RICE":
      return "rice";
    case "COOKING_OIL":
    case "OIL":
      return "oil";
    case "SUGAR":
      return "sugar";
    case "EGGS":
      return "eggs";
    case "FLOUR":
      return "flour";
    case "SALT":
      return "seasoning";
    case "INSTANT_NOODLES":
      return "seasoning";
    case "CHILI":
      return "seasoning";
    case "SHALLOTS":
      return "seasoning";
    case "GARLIC":
      return "seasoning";
    case "CHICKEN":
      return "proteins";
    case "BEEF":
      return "proteins";
    case "FISH":
      return "proteins";
    default:
      return "rice";
  }
}

function normalizeProductUnit(value: string | undefined): ProductPrice["unit"] {
  switch (String(value ?? "").toUpperCase()) {
    case "LITER":
      return "liter";
    case "PCS":
      return "pcs";
    case "PACK":
      return "pack";
    case "TRAY":
      return "pack";
    case "KG":
    default:
      return "kg";
  }
}

function normalizeStoreData(store: z.infer<typeof backendStoreSchema>): Store {
  const cityName = typeof store.city === "string" ? store.city : store.city?.name ?? "Jakarta";
  const rawProducts = Array.isArray(store.priceReports) && store.priceReports.length > 0 ? store.priceReports : store.products ?? [];

  return {
    id: String(store.id ?? store.slug ?? store.name ?? "store"),
    name: String(store.name ?? "Toko"),
    city: String(cityName),
    district: String(store.district ?? store.address ?? "-"),
    type: (store.type ?? "market") as StoreType,
    rating: Number(store.rating ?? 4.5),
    reviewCount: Number(store.reviewCount ?? 0),
    distanceKm: Number(store.distanceKm ?? 0),
    updatedAt: String(store.updatedAt ?? "baru saja"),
    coordinates: {
      x: Number(store.coordinates?.x ?? 0),
      y: Number(store.coordinates?.y ?? 0),
      lat: Number(store.coordinates?.lat ?? store.lat ?? 0),
      lng: Number(store.coordinates?.lng ?? store.lng ?? 0),
    },
    products: rawProducts
      .filter((product) => {
        const report = "status" in product ? product.status : undefined;
        return !report || report.toUpperCase() !== "REJECTED";
      })
      .map((product, index) => {
        const productName = "product" in product && product.product ? product.product.name : "name" in product ? product.name : undefined;
        const productCategory = "product" in product && product.product ? product.product.category : "category" in product ? product.category : undefined;
        const productUnit = "product" in product && product.product ? product.product.defaultUnit : "unit" in product ? product.unit : undefined;
        const productId = "product" in product && product.product ? product.product.id : "id" in product ? product.id : undefined;

        return {
          id: String(productId ?? `${store.id ?? store.slug ?? store.name}-product-${index}`),
          name: String(productName ?? "Produk"),
          category: normalizeProductCategory(productCategory),
          unit: normalizeProductUnit(productUnit),
          price: Number("price" in product ? product.price ?? product.normalizedUnitPrice ?? 0 : 0),
          normalizedUnitPrice: Number("normalizedUnitPrice" in product ? product.normalizedUnitPrice ?? product.price ?? 0 : 0),
          isPromo: Boolean("isPromo" in product ? product.isPromo ?? false : false),
        };
      }),
  };
}

export async function fetchStores(): Promise<Store[]> {
  try {
    const data = await apiFetch("/stores?limit=20", {
      schema: z.array(backendStoreSchema),
    });
    const normalized = Array.isArray(data) && data.length > 0 ? data.map(normalizeStoreData) : mockStores;
    storeCache = normalized;
    return normalized;
  } catch {
    const fallback = storeCache ?? mockStores;
    storeCache = fallback;
    return fallback;
  }
}

export async function fetchCities(): Promise<CitySummary[]> {
  try {
    const data = await apiFetch("/cities", {
      schema: z.array(backendCitySchema),
    });

    if (!Array.isArray(data) || data.length === 0) {
      const fallback = cityCache ?? getCities();
      cityCache = fallback;
      return fallback;
    }

    const normalized = data.map((city) => ({
      slug: String(city.slug ?? city.name?.toLowerCase().replace(/\s+/g, "-") ?? "city"),
      name: String(city.name ?? "Kota"),
      province: String(city.province ?? "-"),
      storeCount: Number(city.storeCount ?? 0),
    }));
    cityCache = normalized;
    return normalized;
  } catch {
    const fallback = cityCache ?? getCities();
    cityCache = fallback;
    return fallback;
  }
}

export async function fetchStoreBySlug(slug: string): Promise<Store | undefined> {
  const stores = await fetchStores();
  return stores.find((store) => store.id === slug || store.name.toLowerCase().replace(/\s+/g, "-") === slug);
}

export async function fetchProductBySlug(slug: string): Promise<{ name: string; stores: StoreWithProduct[] } | undefined> {
  const stores = await fetchStores();
  const productName = Array.from(new Set(stores.flatMap((store) => store.products.map((product) => product.name)))).find(
    (name) => name.toLowerCase().replace(/\s+/g, "-") === slug,
  );

  if (!productName) {
    return undefined;
  }

  return {
    name: productName,
    stores: getTopCheapestStores(productName),
  };
}

export function getStores(): Store[] {
  return storeCache ?? mockStores;
}

export function getTopCheapestStores(productName: string): StoreWithProduct[] {
  const stores = getStores();

  return [...stores]
    .map((store) => {
      const product = store.products.find((item) => item.name === productName);
      return {
        ...store,
        product,
      };
    })
    .filter((store): store is StoreWithProduct & { product: ProductPrice } => Boolean(store.product))
    .sort((a, b) => a.product.normalizedUnitPrice - b.product.normalizedUnitPrice)
    .slice(0, 4);
}

export function getCities(): CitySummary[] {
  if (cityCache) {
    return cityCache;
  }

  const stores = getStores();

  return Array.from(
    new Map(
      stores.map((store) => [store.city, { slug: store.city.toLowerCase().replace(/\s+/g, "-"), name: store.city, province: store.city === "Jakarta" ? "DKI Jakarta" : store.city === "Bandung" ? "Jawa Barat" : store.city === "Surabaya" ? "Jawa Timur" : "Jawa Tengah", storeCount: 0 }]),
    ).values(),
  ).map((city) => ({
    ...city,
    storeCount: stores.filter((store) => store.city === city.name).length,
  }));
}

export function getStoreBySlug(slug: string): Store | undefined {
  return getStores().find((store) => store.id === slug || store.name.toLowerCase().replace(/\s+/g, "-") === slug);
}

export function getProductNames(): string[] {
  return Array.from(new Set(getStores().flatMap((store) => store.products.map((product) => product.name))));
}

export function getProductBySlug(slug: string): { name: string; stores: StoreWithProduct[] } | undefined {
  const productName = getProductNames().find((name) => name.toLowerCase().replace(/\s+/g, "-") === slug);

  if (!productName) {
    return undefined;
  }

  return {
    name: productName,
    stores: getTopCheapestStores(productName),
  };
}
