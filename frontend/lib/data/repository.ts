import { z } from "zod";

import { apiFetch } from "@/lib/api-client";
import {
  citySchema,
  currentUserSchema,
  pageSchema,
  pendingItemSchema,
  placeDetailsSchema,
  placeLookupSchema,
  placeSuggestionSchema,
  productDetailSchema,
  productSchema,
  storeDetailSchema,
  storeSummarySchema,
  type City,
  type CurrentUser,
  type PendingItem,
  type PlaceDetails,
  type PlaceLookup,
  type PlaceSuggestion,
  type Product,
  type ProductDetail,
  type StoreDetail,
  type StoreSummary,
  type StoreType,
  type ProductUnit,
} from "@/lib/data/types";

export type StoreSearchParams = {
  product?: string;
  city?: string;
  q?: string;
  type?: StoreType[];
  maxPrice?: number;
  promo?: boolean;
  fresh?: 3 | 14 | 30;
  sort?: "cheapest" | "nearest" | "recent";
  lat?: number;
  lng?: number;
  bbox?: string | [number, number, number, number];
  offset?: number;
  limit?: number;
};

export type PriceReportInput = {
  storeSlug?: string;
  placeId?: string;
  storeType?: StoreType;
  productSlug: string;
  price: number;
  quantity: number;
  unit: ProductUnit;
};

export type PromoInput = {
  storeSlug?: string;
  placeId?: string;
  storeType?: StoreType;
  productSlug: string;
  promoPrice?: number;
  discountPct?: number;
  conditions?: string;
  validFrom: string;
  validTo: string;
};

export type VoteInput = { priceReportId?: string; promoId?: string };

function toQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }

  const text = search.toString();
  return text ? `?${text}` : "";
}

export function listCities(): Promise<City[]> {
  return apiFetch("/cities", { schema: z.array(citySchema) });
}

export function getCity(slug: string): Promise<City> {
  return apiFetch(`/cities/${encodeURIComponent(slug)}`, { schema: citySchema });
}

export function listProducts(): Promise<Product[]> {
  return apiFetch("/products", { schema: z.array(productSchema) });
}

export function getProduct(slug: string, citySlug?: string): Promise<ProductDetail> {
  return apiFetch(`/products/${encodeURIComponent(slug)}${toQuery({ city: citySlug })}`, {
    schema: productDetailSchema,
  });
}

export function listStores(params: StoreSearchParams = {}): Promise<{ items: StoreSummary[]; total: number; offset: number; limit: number }> {
  const query = toQuery({
    product: params.product,
    city: params.city,
    q: params.q,
    type: params.type?.join(","),
    maxPrice: params.maxPrice,
    promo: params.promo ? 1 : undefined,
    fresh: params.fresh,
    sort: params.sort,
    lat: params.lat,
    lng: params.lng,
    bbox: Array.isArray(params.bbox) ? params.bbox.join(",") : params.bbox,
    offset: params.offset,
    limit: params.limit,
  });

  return apiFetch(`/stores${query}`, {
    schema: pageSchema(storeSummarySchema),
  });
}

export function getStore(slug: string): Promise<StoreDetail> {
  return apiFetch(`/stores/${encodeURIComponent(slug)}`, { schema: storeDetailSchema });
}

export function getStorePlaceDetails(slug: string): Promise<PlaceDetails> {
  return apiFetch(`/stores/${encodeURIComponent(slug)}/place-details`, { schema: placeDetailsSchema });
}

export function submitPriceReport(input: PriceReportInput): Promise<{ id: string; status: "pending" }> {
  return apiFetch("/price-reports", {
    method: "POST",
    body: input,
    schema: z.object({ id: z.string(), status: z.literal("pending") }),
  });
}

export function submitPromo(input: PromoInput): Promise<{ id: string; status: "pending" }> {
  return apiFetch("/promos", {
    method: "POST",
    body: input,
    schema: z.object({ id: z.string(), status: z.literal("pending") }),
  });
}

export function castVote(input: VoteInput): Promise<{ confirmationCount: number; verifiedAt: string | null }> {
  return apiFetch("/votes", {
    method: "POST",
    body: input,
    schema: z.object({
      confirmationCount: z.number().int().nonnegative(),
      verifiedAt: z.string().nullable(),
    }),
  });
}

export function autocompletePlaces(input: {
  input: string;
  sessionToken?: string;
  lat?: number;
  lng?: number;
}): Promise<PlaceSuggestion[]> {
  const query = toQuery({
    input: input.input,
    sessionToken: input.sessionToken,
    lat: input.lat,
    lng: input.lng,
  });

  return apiFetch(`/places/autocomplete${query}`, {
    schema: z.array(placeSuggestionSchema),
  });
}

export function lookupPlace(placeId: string, sessionToken?: string): Promise<PlaceLookup> {
  const query = toQuery({ placeId, sessionToken });
  return apiFetch(`/places/details${query}`, { schema: placeLookupSchema });
}

export function listPendingItems(): Promise<PendingItem[]> {
  return apiFetch("/admin/pending", {
    schema: z.object({ items: z.array(pendingItemSchema) }),
  }).then((payload) => payload.items);
}

export function setModerationStatus(
  kind: "price-report" | "promo",
  id: string,
  status: "approved" | "rejected",
): Promise<{ id: string; status: "approved" | "rejected" }> {
  const endpoint =
    kind === "price-report"
      ? `/admin/price-reports/${encodeURIComponent(id)}/status`
      : `/admin/promos/${encodeURIComponent(id)}/status`;

  return apiFetch(endpoint, {
    method: "PATCH",
    body: { status },
    schema: z.object({
      id: z.string(),
      status: z.enum(["approved", "rejected"]),
    }),
  });
}

export function getCurrentUser(): Promise<CurrentUser> {
  return apiFetch("/auth/me", { schema: currentUserSchema });
}
