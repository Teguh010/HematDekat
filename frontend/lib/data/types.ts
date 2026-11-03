import { z } from "zod";

export const storeTypeSchema = z.enum(["supermarket", "minimarket", "market", "grocery-stall"]);
export const productUnitSchema = z.enum(["kg", "liter", "pcs", "pack", "tray"]);

export const citySchema = z.object({
  slug: z.string(),
  name: z.string(),
  province: z.string(),
  centerLat: z.number(),
  centerLng: z.number(),
  storeCount: z.number().int().nonnegative(),
});

export const productSchema = z.object({
  slug: z.string(),
  name: z.string(),
  category: z.string(),
  defaultUnit: productUnitSchema,
});

export const priceSummarySchema = z.object({
  priceReportId: z.string(),
  productSlug: z.string(),
  productName: z.string(),
  unit: productUnitSchema,
  price: z.number().int(),
  quantity: z.number(),
  normalizedUnitPrice: z.number().int(),
  verifiedAt: z.string(),
  confirmationCount: z.number().int().nonnegative(),
});

export const storeSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  type: storeTypeSchema,
  city: z.object({
    slug: z.string(),
    name: z.string(),
  }),
  district: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
  distanceKm: z.number().nullable(),
  price: priceSummarySchema.nullable(),
  hasActivePromo: z.boolean(),
});

export const promoSummarySchema = z.object({
  id: z.string(),
  productSlug: z.string(),
  productName: z.string(),
  promoPrice: z.number().nullable(),
  discountPct: z.number().nullable(),
  conditions: z.string().nullable(),
  validFrom: z.string(),
  validTo: z.string(),
  confirmationCount: z.number().int().nonnegative(),
});

export const storeDetailSchema = storeSummarySchema
  .omit({ price: true, distanceKm: true })
  .extend({
    placeId: z.string(),
    prices: z.array(priceSummarySchema),
    promos: z.array(promoSummarySchema),
    googleMapsUrl: z.string(),
  });

export const placeDetailsSchema = z.union([
  z.object({ available: z.literal(false) }),
  z.object({
    available: z.literal(true),
    name: z.string(),
    rating: z.number().nullable(),
    userRatingCount: z.number().nullable(),
    formattedAddress: z.string().nullable(),
    photo: z
      .object({
        uri: z.string(),
        attributions: z.array(
          z.object({
            displayName: z.string(),
            uri: z.string().nullable(),
          }),
        ),
      })
      .nullable(),
  }),
]);

export const productDetailSchema = z.object({
  product: productSchema,
  cheapest: z.array(storeSummarySchema).max(20),
  cityAverages: z.array(
    z.object({
      citySlug: z.string(),
      cityName: z.string(),
      averageUnitPrice: z.number(),
      reportCount: z.number().int().nonnegative(),
    }),
  ),
});

export const placeSuggestionSchema = z.object({
  placeId: z.string(),
  mainText: z.string(),
  secondaryText: z.string().nullable(),
});

export const placeLookupSchema = z.object({
  placeId: z.string(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  formattedAddress: z.string().nullable(),
  district: z.string().nullable(),
  suggestedType: storeTypeSchema,
  existingStoreSlug: z.string().nullable(),
});

export const pendingItemSchema = z.object({
  kind: z.enum(["price-report", "promo"]),
  id: z.string(),
  store: z.object({
    slug: z.string(),
    name: z.string(),
  }),
  product: z.object({
    slug: z.string(),
    name: z.string(),
    defaultUnit: productUnitSchema,
  }),
  submittedBy: z.string(),
  price: z.number().nullable(),
  quantity: z.number().nullable(),
  normalizedUnitPrice: z.number().nullable(),
  promoPrice: z.number().nullable(),
  discountPct: z.number().nullable(),
  validFrom: z.string().nullable(),
  validTo: z.string().nullable(),
  flagged: z.boolean(),
  flagReason: z.string().nullable(),
  createdAt: z.string(),
});

export const currentUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: z.enum(["user", "admin"]),
  points: z.number().int(),
});

export const leaderboardPeriodSchema = z.enum(["week", "month", "all"]);

export const leaderboardItemSchema = z.object({
  rank: z.number().int().positive(),
  userId: z.string(),
  displayName: z.string(),
  points: z.number().int(),
});

export const pageSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    offset: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
  });

export const profileBadgeKeySchema = z.enum([
  "first-report",
  "price-hunter",
  "price-guardian",
  "market-expert",
]);

export const profileBadgeSchema = z.object({
  key: profileBadgeKeySchema,
  earnedAt: z.string(),
});

export const profileReportStatusSchema = z.enum(["pending", "approved", "rejected"]);

export const profileReportSchema = z.object({
  id: z.string(),
  kind: z.enum(["price-report", "promo"]),
  store: z.object({ slug: z.string(), name: z.string() }),
  product: z.object({ slug: z.string(), name: z.string() }),
  status: profileReportStatusSchema,
  createdAt: z.string(),
});

export const profileSchema = z.object({
  user: currentUserSchema,
  rank: z.number().int().positive().nullable(),
  badges: z.array(profileBadgeSchema),
  savedStores: z.array(storeSummarySchema),
  reports: z.array(profileReportSchema),
});

export type StoreType = z.infer<typeof storeTypeSchema>;
export type ProductUnit = z.infer<typeof productUnitSchema>;
export type City = z.infer<typeof citySchema>;
export type Product = z.infer<typeof productSchema>;
export type PriceSummary = z.infer<typeof priceSummarySchema>;
export type StoreSummary = z.infer<typeof storeSummarySchema>;
export type PromoSummary = z.infer<typeof promoSummarySchema>;
export type StoreDetail = z.infer<typeof storeDetailSchema>;
export type PlaceDetails = z.infer<typeof placeDetailsSchema>;
export type ProductDetail = z.infer<typeof productDetailSchema>;
export type PlaceSuggestion = z.infer<typeof placeSuggestionSchema>;
export type PlaceLookup = z.infer<typeof placeLookupSchema>;
export type PendingItem = z.infer<typeof pendingItemSchema>;
export type CurrentUser = z.infer<typeof currentUserSchema>;
export type LeaderboardPeriod = z.infer<typeof leaderboardPeriodSchema>;
export type LeaderboardItem = z.infer<typeof leaderboardItemSchema>;
export type Page<T> = { items: T[]; total: number; offset: number; limit: number };
export type ProfileBadgeKey = z.infer<typeof profileBadgeKeySchema>;
export type ProfileBadge = z.infer<typeof profileBadgeSchema>;
export type ProfileReportStatus = z.infer<typeof profileReportStatusSchema>;
export type ProfileReport = z.infer<typeof profileReportSchema>;
export type Profile = z.infer<typeof profileSchema>;
