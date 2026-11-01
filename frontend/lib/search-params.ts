import { z } from "zod";

const storeTypeValues = ["supermarket", "minimarket", "market", "grocery-stall"] as const;
const slugSchema = z.string().trim().min(1).max(60).regex(/^[a-z0-9-]+$/);

export const storeTypeSchema = z.enum(storeTypeValues);
export const storeSortSchema = z.enum(["cheapest", "nearest", "recent"]);
export const storeFreshnessSchema = z.enum(["3", "14", "30"]);

export type StoreType = z.infer<typeof storeTypeSchema>;
export type StoreSort = z.infer<typeof storeSortSchema>;
export type StoreFreshness = 3 | 14 | 30;
export type StoreSearchParams = {
  product?: string;
  q?: string;
  city?: string;
  type?: StoreType[];
  maxPrice?: number;
  promo?: boolean;
  fresh?: StoreFreshness;
  sort?: StoreSort;
  lat?: number;
  lng?: number;
  bbox?: [number, number, number, number];
};

const defaultStoreSearchParams: StoreSearchParams = {
  product: "beras-premium",
  promo: false,
  sort: "cheapest",
};

function pick<T>(schema: z.ZodType<T>, value: unknown): T | undefined {
  const result = schema.safeParse(value);
  return result.success ? result.data : undefined;
}

function toSingleString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(",") || undefined;
  }

  return typeof value === "string" ? value : undefined;
}

function parseTypeList(value: string | undefined): StoreType[] | undefined {
  if (!value) {
    return undefined;
  }

  const types = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => pick(storeTypeSchema, part))
    .filter((part): part is StoreType => part !== undefined);

  return types.length > 0 ? types : undefined;
}

function parseBBox(value: string | undefined): [number, number, number, number] | undefined {
  if (!value) {
    return undefined;
  }

  const values = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => Number(part));

  if (values.length !== 4 || values.some((part) => Number.isNaN(part))) {
    return undefined;
  }

  return [values[0], values[1], values[2], values[3]];
}

export function parseSearchParams(record: Record<string, string | string[] | undefined>): StoreSearchParams {
  const product = pick(slugSchema, toSingleString(record.product)) ?? defaultStoreSearchParams.product;
  const q = pick(z.string().trim().min(1).max(60), toSingleString(record.q));
  const city = pick(slugSchema, toSingleString(record.city));
  const type = parseTypeList(toSingleString(record.type));
  const maxPrice = pick(z.coerce.number().int().min(1).max(10_000_000), toSingleString(record.maxPrice));
  const promoValue = pick(z.enum(["0", "1"]).transform((value) => value === "1"), toSingleString(record.promo));
  const freshValue = pick(storeFreshnessSchema.transform((value) => Number(value) as StoreFreshness), toSingleString(record.fresh));
  const sort = pick(storeSortSchema, toSingleString(record.sort)) ?? defaultStoreSearchParams.sort;
  const lat = pick(z.coerce.number().min(-11).max(6), toSingleString(record.lat));
  const lng = pick(z.coerce.number().min(95).max(141), toSingleString(record.lng));
  const bbox = parseBBox(toSingleString(record.bbox));

  return {
    product,
    q: q ?? undefined,
    city: city ?? undefined,
    type: type ?? undefined,
    maxPrice: maxPrice ?? undefined,
    promo: promoValue ?? defaultStoreSearchParams.promo,
    fresh: freshValue ?? undefined,
    sort,
    lat: lat ?? undefined,
    lng: lng ?? undefined,
    bbox: bbox ?? undefined,
  };
}

export function buildSearchParams(params: Partial<StoreSearchParams>): string {
  const query: Record<string, string> = {};

  const product = params.product?.trim();
  if (product && product !== defaultStoreSearchParams.product) {
    query.product = product;
  }

  if (params.q && params.q.trim()) {
    query.q = params.q.trim();
  }

  if (params.city && params.city.trim()) {
    query.city = params.city.trim();
  }

  if (params.type && params.type.length > 0) {
    query.type = params.type.join(",");
  }

  if (typeof params.maxPrice === "number" && Number.isFinite(params.maxPrice)) {
    query.maxPrice = String(params.maxPrice);
  }

  if (params.promo === true) {
    query.promo = "1";
  }

  if (params.fresh && [3, 14, 30].includes(params.fresh)) {
    query.fresh = String(params.fresh);
  }

  if (params.sort && params.sort !== defaultStoreSearchParams.sort) {
    query.sort = params.sort;
  }

  if (typeof params.lat === "number" && Number.isFinite(params.lat)) {
    query.lat = String(params.lat);
  }

  if (typeof params.lng === "number" && Number.isFinite(params.lng)) {
    query.lng = String(params.lng);
  }

  if (params.bbox && params.bbox.length === 4) {
    query.bbox = params.bbox.join(",");
  }

  return Object.entries(query)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}

export const storeSearchParamsSchema = z.object({
  product: z.string().trim().min(1).max(60).optional(),
  q: z.string().trim().min(1).max(60).optional(),
  city: z.string().trim().min(1).max(60).optional(),
  type: z.array(storeTypeSchema).optional(),
  maxPrice: z.coerce.number().int().min(1).max(10_000_000).optional(),
  promo: z.boolean().optional(),
  fresh: z.union([z.literal(3), z.literal(14), z.literal(30)]).optional(),
  sort: storeSortSchema.optional(),
  lat: z.coerce.number().min(-11).max(6).optional(),
  lng: z.coerce.number().min(95).max(141).optional(),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
});
