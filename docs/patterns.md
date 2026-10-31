# Code patterns

Reference implementations for patterns that repeat across [plan.md](../plan.md) steps. Copy the shape, not necessarily every line. If a library rejects something here (version differences), follow the library's docs in `node_modules/<package>/` and update this file in the same change.

Contents:

- Frontend: [next-intl setup](#next-intl-setup), [lint rule for hardcoded strings](#lint-rule-for-hardcoded-strings), [format helpers](#format-helpers), [API client](#api-client), [types and repository function](#repository-function), [server page](#server-page), [current user](#current-user), [URL state](#url-state), [error state](#error-state), [map clustering](#map-clustering), [frontend test](#frontend-test)
- Backend: [module, service, controller](#module-service-controller), [DTO mapper and public rules](#dto-mapper-and-public-rules), [roles guard](#roles-guard), [Places API (New)](#places-api-new), [backend unit test](#backend-unit-test)
- [Troubleshooting](#troubleshooting)

---

## Frontend

Style: double quotes, semicolons, named exports, `@/` imports inside `app/`, `components/`, and `lib/`; relative imports in `tests/`.

### next-intl setup

`frontend/i18n/request.ts`:

```ts
import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  const locale = "id";

  return {
    locale,
    timeZone: "Asia/Jakarta",
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

`frontend/next.config.ts` (keep the existing options):

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
```

`frontend/global.d.ts` (type-safe keys: a missing key becomes a typecheck error):

```ts
import type messages from "./messages/id.json";

declare module "next-intl" {
  interface AppConfig {
    Locale: "id";
    Messages: typeof messages;
  }
}
```

`frontend/app/layout.tsx` (shape after C2.4 and C2.5):

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";

import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { CurrentUserProvider } from "@/components/current-user-provider";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return {
    title: { template: `%s | ${t("appName")}`, default: t("appName") },
    description: t("tagline"),
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-slate-950 text-slate-100">
        <NextIntlClientProvider>
          <CurrentUserProvider>
            <AppHeader />
            <main id="content" className="flex flex-1 flex-col">
              {children}
            </main>
            <AppFooter />
          </CurrentUserProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

Using messages:

```tsx
// Client component or non-async server component
import { useTranslations } from "next-intl";

const t = useTranslations("store");
t("verifiedDaysAgo", { days: 3 }); // "Diverifikasi 3 hari lalu"

// Async server component, generateMetadata
import { getTranslations } from "next-intl/server";

const t = await getTranslations("store");
```

`messages/id.json` excerpt:

```json
{
  "common": {
    "appName": "HematDekat",
    "tagline": "Cari sembako termurah di dekatmu"
  },
  "freshness": {
    "fresh": "Baru diverifikasi",
    "recent": "Diverifikasi {days} hari lalu",
    "stale": "Perlu dicek ulang"
  },
  "units": {
    "kg": "kg",
    "liter": "liter",
    "pcs": "butir",
    "pack": "bungkus",
    "tray": "tray"
  },
  "storeType": {
    "supermarket": "Supermarket",
    "minimarket": "Minimarket",
    "market": "Pasar",
    "grocery-stall": "Toko kelontong"
  }
}
```

### Lint rule for hardcoded strings

`frontend/eslint.config.mjs`:

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import i18next from "eslint-plugin-i18next";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["app/**/*.tsx", "components/**/*.tsx"],
    plugins: { i18next },
    rules: {
      "i18next/no-literal-string": [
        "error",
        {
          mode: "jsx-only",
          "jsx-attributes": { include: ["placeholder", "title", "alt", "aria-label"] },
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
```

Punctuation-only text such as `·` or `/` may be flagged; put it in a message too, or render it with `{"·"}`. If the plugin rejects an option name, read `node_modules/eslint-plugin-i18next/README.md`.

### Format helpers

`frontend/lib/format.ts`:

```ts
const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const DAY_MS = 86_400_000;

export type FreshnessLevel = "fresh" | "recent" | "stale";

export function formatRupiah(value: number): string {
  // Intl inserts a non-breaking space after "Rp"; the design uses "Rp14.700".
  return rupiahFormatter.format(value).replace(/\s/g, "");
}

export function formatUnitPrice(value: number, unitLabel: string): string {
  return `${formatRupiah(value)}/${unitLabel}`;
}

export function daysSince(iso: string, now: Date = new Date()): number {
  const diff = now.getTime() - new Date(iso).getTime();
  return Math.max(0, Math.floor(diff / DAY_MS));
}

export function freshnessLevel(iso: string, now: Date = new Date()): FreshnessLevel {
  const days = daysSince(iso, now);
  if (days <= 3) return "fresh";
  if (days <= 14) return "recent";
  return "stale";
}
```

`unitLabel` comes from messages: `formatUnitPrice(price.normalizedUnitPrice, t(\`units.${price.unit}\`))`. Unit labels are UI text, so they are not hardcoded in `lib/`.

### API client

`frontend/lib/api-client.ts`:

```ts
import type { z } from "zod";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiFetchOptions<T> = {
  method?: HttpMethod;
  body?: unknown;
  schema: z.ZodType<T>;
  signal?: AbortSignal;
};

function getBaseUrl(): string {
  const serverUrl = typeof window === "undefined" ? process.env.BACKEND_INTERNAL_URL : undefined;
  const url = serverUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  return url.replace(/\/$/, "");
}

function toApiError(status: number, payload: unknown): ApiError {
  const body = (payload ?? {}) as { message?: unknown; errors?: unknown };
  const message =
    typeof body.message === "string"
      ? body.message
      : Array.isArray(body.message)
        ? body.message.join(", ")
        : `Request failed with status ${status}`;

  const fieldErrors: Record<string, string> = {};
  if (Array.isArray(body.errors)) {
    for (const item of body.errors) {
      if (item && typeof item === "object" && "path" in item && "message" in item) {
        fieldErrors[String(item.path)] = String(item.message);
      }
    }
  }

  return new ApiError(status, message, fieldErrors);
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions<T>): Promise<T> {
  const { method = "GET", body, schema, signal } = options;

  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}${path}`, {
      method,
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    throw new ApiError(0, error instanceof Error ? error.message : "Network error");
  }

  const payload: unknown = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    throw toApiError(response.status, payload);
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError(response.status, `Unexpected response shape from ${path}`);
  }

  return parsed.data;
}
```

For 204 responses pass `schema: z.null()`.

### Repository function

`frontend/lib/data/types.ts` excerpt:

```ts
import { z } from "zod";

export const storeTypeSchema = z.enum(["supermarket", "minimarket", "market", "grocery-stall"]);
export const productUnitSchema = z.enum(["kg", "liter", "pcs", "pack", "tray"]);

export const citySchema = z.object({
  slug: z.string(),
  name: z.string(),
  province: z.string(),
  centerLat: z.number(),
  centerLng: z.number(),
  storeCount: z.number().int(),
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
  confirmationCount: z.number().int(),
});

export function pageSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    total: z.number().int(),
    offset: z.number().int(),
    limit: z.number().int(),
  });
}

export type StoreType = z.infer<typeof storeTypeSchema>;
export type ProductUnit = z.infer<typeof productUnitSchema>;
export type City = z.infer<typeof citySchema>;
export type PriceSummary = z.infer<typeof priceSummarySchema>;
```

`frontend/lib/data/repository.ts` excerpt:

```ts
import { z } from "zod";

import { apiFetch } from "@/lib/api-client";
import { citySchema, pageSchema, storeSummarySchema, type City, type StoreType } from "@/lib/data/types";

export type ListStoresParams = {
  product?: string;
  city?: string;
  q?: string;
  type?: StoreType[];
  offset?: number;
  limit?: number;
};

function toQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
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

export function listStores(params: ListStoresParams) {
  const query = toQuery({ ...params, type: params.type?.join(",") });
  return apiFetch(`/stores${query}`, { schema: pageSchema(storeSummarySchema) });
}
```

From C6.1 on, `listStores` takes the parsed URL params and uses `buildSearchParams()` instead of `toQuery`.

### Server page

Shape for every data page (`app/stores/[slug]/page.tsx` shown). Rules: params awaited inside `<Suspense>`, 404 through `notFound()`, other errors render `ErrorState`, no `generateStaticParams`.

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api-client";
import { getStore } from "@/lib/data/repository";
import type { StoreDetail } from "@/lib/data/types";

type StorePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations("store");

  try {
    const store = await getStore(slug);
    return {
      title: store.name,
      description: t("metaDescription", { name: store.name, city: store.city.name }),
    };
  } catch {
    return { title: t("fallbackTitle") };
  }
}

export default function StorePage({ params }: StorePageProps) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto mt-8 h-96 w-full max-w-6xl" />}>
      <StorePageContent params={params} />
    </Suspense>
  );
}

async function StorePageContent({ params }: StorePageProps) {
  const { slug } = await params;
  const t = await getTranslations("store");

  let store: StoreDetail;
  try {
    store = await getStore(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    return <ErrorState title={t("loadError")} />;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-white sm:text-3xl">{store.name}</h1>
      {/* ... */}
    </div>
  );
}
```

### Current user

`frontend/components/current-user-provider.tsx`:

```tsx
"use client";

import { createContext, use, useCallback, useEffect, useState, type ReactNode } from "react";

import { apiFetch } from "@/lib/api-client";
import { currentUserSchema, type CurrentUser } from "@/lib/data/types";

type CurrentUserState =
  | { status: "loading"; user: null }
  | { status: "signed-out"; user: null }
  | { status: "signed-in"; user: CurrentUser };

type CurrentUserValue = CurrentUserState & { refresh: () => Promise<void> };

const CurrentUserContext = createContext<CurrentUserValue | null>(null);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CurrentUserState>({ status: "loading", user: null });

  const refresh = useCallback(async () => {
    try {
      const user = await apiFetch("/auth/me", { schema: currentUserSchema });
      setState({ status: "signed-in", user });
    } catch {
      // 401 (signed out) and network errors both mean "no usable session".
      setState({ status: "signed-out", user: null });
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads the session once on mount
    void refresh();
  }, [refresh]);

  return <CurrentUserContext value={{ ...state, refresh }}>{children}</CurrentUserContext>;
}

export function useCurrentUser(): CurrentUserValue {
  const value = use(CurrentUserContext);
  if (!value) throw new Error("useCurrentUser must be used inside CurrentUserProvider");
  return value;
}
```

`frontend/components/auth/require-user.tsx` (C8.3):

```tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, type ReactNode } from "react";

import { useCurrentUser } from "@/components/current-user-provider";
import { Skeleton } from "@/components/ui/skeleton";

export function RequireUser({ role, children }: { role?: "admin"; children: ReactNode }) {
  const { status, user } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");

  useEffect(() => {
    if (status !== "signed-out") return;
    const query = searchParams.toString();
    const next = query ? `${pathname}?${query}` : pathname;
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [status, pathname, searchParams, router]);

  if (status !== "signed-in") return <Skeleton className="h-64 w-full" />;
  if (role === "admin" && user.role !== "admin") {
    return <p className="text-slate-300">{t("noAccess")}</p>;
  }
  return children;
}
```

The page that renders `RequireUser` wraps it in `<Suspense>` because it uses `useSearchParams()`.

### URL state

```tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { buildSearchParams, parseSearchParams, type StoreSearchParams } from "@/lib/search-params";

export function useStoreSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = parseSearchParams(Object.fromEntries(searchParams.entries()));

  function update(patch: Partial<StoreSearchParams>) {
    const query = buildSearchParams({ ...params, ...patch });
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return { params, update };
}
```

`parseSearchParams` validates each field on its own so one bad value does not drop the others:

```ts
function pick<T>(schema: z.ZodType<T>, value: unknown): T | undefined {
  const result = schema.safeParse(value);
  return result.success ? result.data : undefined;
}

// maxPrice: pick(z.coerce.number().int().min(1).max(10_000_000), record.maxPrice)
// type:     pick(z.string().transform((v) => v.split(",")).pipe(z.array(storeTypeSchema).min(1)), record.type)
```

### Error state

`frontend/components/ui/error-state.tsx` is a client component so server pages can render it without passing functions:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export function ErrorState({ title, onRetry }: { title?: string; onRetry?: () => void }) {
  const router = useRouter();
  const t = useTranslations("errors");

  return (
    <div role="alert" className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
      <p className="font-semibold">{title ?? t("generic")}</p>
      <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry ?? (() => router.refresh())}>
        {t("retry")}
      </Button>
    </div>
  );
}
```

### Map clustering

`AdvancedMarker` needs a real Map ID. Use `process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "DEMO_MAP_ID"` for the `mapId` prop (`DEMO_MAP_ID` works for development).

`frontend/components/map/clustered-pins.tsx`:

```tsx
"use client";

import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PricePin } from "@/components/map/price-pin";
import type { StoreSummary } from "@/lib/data/types";

type ClusteredPinsProps = {
  stores: StoreSummary[];
  hoveredStoreId: string | null;
  selectedStoreId: string | null;
  onSelect: (storeId: string) => void;
};

export function ClusteredPins({ stores, hoveredStoreId, selectedStoreId, onSelect }: ClusteredPinsProps) {
  const map = useMap();
  const [markers, setMarkers] = useState<Record<string, google.maps.marker.AdvancedMarkerElement>>({});

  const clusterer = useMemo(() => (map ? new MarkerClusterer({ map }) : null), [map]);

  useEffect(() => {
    if (!clusterer) return;
    clusterer.clearMarkers();
    clusterer.addMarkers(Object.values(markers));
  }, [clusterer, markers]);

  useEffect(() => () => clusterer?.setMap(null), [clusterer]);

  const setMarkerRef = useCallback((marker: google.maps.marker.AdvancedMarkerElement | null, id: string) => {
    setMarkers((previous) => {
      if ((marker && previous[id]) || (!marker && !previous[id])) return previous;
      if (marker) return { ...previous, [id]: marker };
      const next = { ...previous };
      delete next[id];
      return next;
    });
  }, []);

  return stores.map((store) => (
    <AdvancedMarker
      key={store.id}
      position={{ lat: store.lat, lng: store.lng }}
      ref={(marker) => setMarkerRef(marker, store.id)}
      onClick={() => onSelect(store.id)}
      zIndex={store.id === selectedStoreId ? 10 : undefined}
    >
      <PricePin store={store} hovered={store.id === hoveredStoreId} selected={store.id === selectedStoreId} />
    </AdvancedMarker>
  ));
}
```

### Frontend test

Tests use `node:test` and run with `npm run test` (`tsx --test tests/**/*.test.ts`).

`frontend/tests/format.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { daysSince, formatRupiah, formatUnitPrice, freshnessLevel } from "../lib/format";

const now = new Date("2026-10-31T00:00:00.000Z");

test("formatRupiah uses id-ID grouping without a space", () => {
  assert.equal(formatRupiah(14700), "Rp14.700");
});

test("formatUnitPrice appends the unit label", () => {
  assert.equal(formatUnitPrice(14700, "kg"), "Rp14.700/kg");
});

test("freshnessLevel thresholds", () => {
  assert.equal(freshnessLevel("2026-10-28T00:00:00.000Z", now), "fresh");
  assert.equal(freshnessLevel("2026-10-20T00:00:00.000Z", now), "recent");
  assert.equal(freshnessLevel("2026-10-01T00:00:00.000Z", now), "stale");
});

test("daysSince never returns a negative number", () => {
  assert.equal(daysSince("2026-11-05T00:00:00.000Z", now), 0);
});
```

To mock the backend in repository tests, replace `global.fetch` and restore it in `finally` (see the existing `tests/repository.test.ts`).

---

## Backend

Style: single quotes, semicolons, ESM with `.js` in relative imports, oxlint.

### Module, service, controller

`backend/src/cities/cities.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CitiesController } from './cities.controller.js';
import { CitiesService } from './cities.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [CitiesController],
  providers: [CitiesService],
  exports: [CitiesService],
})
export class CitiesModule {}
```

`backend/src/cities/cities.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { type CityDto, publicStoreWhere, toCityDto } from '../common/dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<CityDto[]> {
    const cities = await this.prisma.city.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { stores: { where: publicStoreWhere(new Date()) } } } },
    });
    return cities.map(toCityDto);
  }

  async findBySlug(slug: string): Promise<CityDto | null> {
    const city = await this.prisma.city.findUnique({
      where: { slug },
      include: { _count: { select: { stores: { where: publicStoreWhere(new Date()) } } } },
    });
    return city ? toCityDto(city) : null;
  }
}
```

`backend/src/cities/cities.controller.ts`:

```ts
import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { CitiesService } from './cities.service.js';

@Controller('cities')
export class CitiesController {
  constructor(private readonly cities: CitiesService) {}

  @Get()
  list() {
    return this.cities.list();
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    const city = await this.cities.findBySlug(slug);
    if (!city) {
      throw new NotFoundException(`City "${slug}" not found`);
    }
    return city;
  }
}
```

Validated query or body:

```ts
const listStoresQuerySchema = z.object({
  product: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  q: z.string().trim().min(1).max(60).optional(),
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

@Get()
list(@Query(new ZodValidationPipe(listStoresQuerySchema)) query: z.infer<typeof listStoresQuerySchema>) {
  return this.stores.search(query);
}
```

Move `ZodValidationPipe` to `src/common/zod-validation.pipe.ts` in C3.3 and update imports.

### DTO mapper and public rules

`backend/src/common/dto.ts` excerpt:

```ts
import type { City, Prisma, PriceReport, Product } from '@prisma/client';
import { toApiUnit } from './enums.js';

export type CityDto = {
  slug: string;
  name: string;
  province: string;
  centerLat: number;
  centerLng: number;
  storeCount: number;
};

export function toCityDto(city: City & { _count: { stores: number } }): CityDto {
  return {
    slug: city.slug,
    name: city.name,
    province: city.province,
    centerLat: city.centerLat,
    centerLng: city.centerLng,
    storeCount: city._count.stores,
  };
}

export function activePromoWhere(now: Date): Prisma.PromoWhereInput {
  return { status: 'APPROVED', validFrom: { lte: now }, validTo: { gte: now } };
}

export function publicStoreWhere(now: Date): Prisma.StoreWhereInput {
  return {
    OR: [
      { priceReports: { some: { status: 'APPROVED' } } },
      { promos: { some: activePromoWhere(now) } },
    ],
  };
}

// Current price: newest verifiedAt first. Postgres sorts NULLs first on DESC, so say "last".
export const currentPriceOrderBy: Prisma.PriceReportOrderByWithRelationInput[] = [
  { verifiedAt: { sort: 'desc', nulls: 'last' } },
  { createdAt: 'desc' },
];

export type PriceSummaryDto = {
  priceReportId: string;
  productSlug: string;
  productName: string;
  unit: ReturnType<typeof toApiUnit>;
  price: number;
  quantity: number;
  normalizedUnitPrice: number;
  verifiedAt: string;
  confirmationCount: number;
};

export function toPriceSummary(report: PriceReport & { product: Product }): PriceSummaryDto {
  return {
    priceReportId: report.id,
    productSlug: report.product.slug,
    productName: report.product.name,
    unit: toApiUnit(report.unit),
    price: report.price,
    quantity: report.quantity,
    normalizedUnitPrice: report.normalizedUnitPrice,
    // Approved reports always have verifiedAt (set on approval and by the seed).
    verifiedAt: (report.verifiedAt ?? report.createdAt).toISOString(),
    confirmationCount: report.confirmationCount,
  };
}
```

Loading the current price for one product on many stores:

```ts
const stores = await this.prisma.store.findMany({
  where: { AND: [publicStoreWhere(now), filters] },
  take: 1000,
  include: {
    city: true,
    priceReports: {
      where: { status: 'APPROVED', product: { slug: productSlug } },
      orderBy: currentPriceOrderBy,
      take: 1,
      include: { product: true },
    },
    _count: { select: { promos: { where: activePromoWhere(now) } } },
  },
});
```

`backend/src/common/enums.ts` excerpt:

```ts
import type { ProductUnit, StoreType } from '@prisma/client';

const storeTypeToApi = {
  SUPERMARKET: 'supermarket',
  MINIMARKET: 'minimarket',
  MARKET: 'market',
  GROCERY_STALL: 'grocery-stall',
} as const satisfies Record<StoreType, string>;

export type ApiStoreType = (typeof storeTypeToApi)[StoreType];

export function toApiStoreType(value: StoreType): ApiStoreType {
  return storeTypeToApi[value];
}

export function fromApiStoreType(value: ApiStoreType): StoreType {
  const entry = Object.entries(storeTypeToApi).find(([, api]) => api === value);
  if (!entry) throw new Error(`Unknown store type ${value}`);
  return entry[0] as StoreType;
}

const unitToApi = { KG: 'kg', LITER: 'liter', PCS: 'pcs', PACK: 'pack', TRAY: 'tray' } as const satisfies Record<
  ProductUnit,
  string
>;

export function toApiUnit(value: ProductUnit) {
  return unitToApi[value];
}
```

### Roles guard

`backend/src/common/roles.decorator.ts`:

```ts
import { SetMetadata } from '@nestjs/common';

export type AppRole = 'USER' | 'ADMIN';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
```

`backend/src/common/roles.guard.ts`:

```ts
import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type AppRole, ROLES_KEY } from './roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AppRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: { role?: AppRole } }>();
    const role = request.user?.role;

    if (!role || !required.includes(role)) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
```

Usage (order matters: the JWT guard sets `req.user` first and returns 401 when signed out):

```ts
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly admin: AdminService) {}
}
```

Reading the signed-in user in a handler:

```ts
@Post()
@UseGuards(JwtAuthGuard)
create(@Req() req: Request & { user: AuthUser }, @Body(new ZodValidationPipe(schema)) body: Input) {
  return this.priceReports.create(req.user.id, body);
}
```

### Places API (New)

All calls go through `backend/src/places/places.service.ts`. The key is sent in the `X-Goog-Api-Key` header, never in a URL that leaves the backend. Validate Google's responses with zod and treat any failure as "not available".

Autocomplete (report form):

```ts
const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': apiKey,
    'X-Goog-FieldMask':
      'suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat',
  },
  body: JSON.stringify({
    input,
    sessionToken,
    languageCode: 'id',
    regionCode: 'id',
    includedRegionCodes: ['id'],
    ...(bias
      ? { locationBias: { circle: { center: { latitude: bias.lat, longitude: bias.lng }, radius: 20000 } } }
      : {}),
  }),
});
// Response: { suggestions?: [{ placePrediction?: { placeId, structuredFormat: { mainText: { text }, secondaryText?: { text } } } }] }
// Map to PlaceSuggestion[] and keep the first 5.
```

Details for a new store (report form; same `sessionToken` as the autocomplete that produced the `placeId`):

```ts
const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
url.searchParams.set('languageCode', 'id');
url.searchParams.set('regionCode', 'id');
url.searchParams.set('sessionToken', sessionToken);

const response = await fetch(url, {
  headers: {
    'X-Goog-Api-Key': apiKey,
    'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,types,primaryType,addressComponents',
  },
});
// Response: { id, displayName: { text }, formattedAddress, location: { latitude, longitude },
//             types: string[], primaryType?: string, addressComponents: [{ longText, shortText, types: string[] }] }
```

Details for the store page (rating and photo; nothing is stored):

```ts
const details = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=id`, {
  headers: {
    'X-Goog-Api-Key': apiKey,
    'X-Goog-FieldMask': 'id,displayName,rating,userRatingCount,formattedAddress,photos',
  },
});
// photos?: [{ name: "places/<id>/photos/<ref>", authorAttributions: [{ displayName, uri, photoUri }] }]

const photo = await fetch(
  `https://places.googleapis.com/v1/${firstPhoto.name}/media?maxWidthPx=800&skipHttpRedirect=true`,
  { headers: { 'X-Goog-Api-Key': apiKey } },
);
// Response: { name, photoUri }. photoUri has no API key; it is the only URL sent to the browser.
```

Allow the photo host in `frontend/next.config.ts` if you use `next/image` (`images.remotePatterns` for `lh3.googleusercontent.com`), or use a plain `<img>` with `loading="lazy"` and an `alt` from messages.

### Backend unit test

Vitest with plain object mocks (as in `src/admin/admin.controller.spec.ts`). Cast mocks with `as unknown as PrismaService` and a comment instead of `any`.

```ts
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import { RolesGuard } from './roles.guard.js';

function contextWithRole(role?: 'USER' | 'ADMIN'): ExecutionContext {
  // Minimal ExecutionContext stub: only the members RolesGuard reads.
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user: role ? { role } : undefined }) }),
  } as unknown as ExecutionContext;
}

const reflector = { getAllAndOverride: () => ['ADMIN'] } as unknown as Reflector;

describe('RolesGuard', () => {
  it('allows admins', () => {
    expect(new RolesGuard(reflector).canActivate(contextWithRole('ADMIN'))).toBe(true);
  });

  it('rejects normal users', () => {
    expect(() => new RolesGuard(reflector).canActivate(contextWithRole('USER'))).toThrow(ForbiddenException);
  });

  it('rejects missing users', () => {
    expect(() => new RolesGuard(reflector).canActivate(contextWithRole())).toThrow(ForbiddenException);
  });
});
```

---

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| Build error about uncached data or `cookies()` accessed outside `<Suspense>` | A server component reads `params`, `searchParams`, or fetches outside a boundary. Move that code into a child component rendered inside `<Suspense>` (see [server page](#server-page)). Server components must not call `cookies()` at all in this project. |
| Build error about `generateMetadata` reading runtime data | See "generateMetadata and generateViewport" in `frontend/node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md`. |
| `empty-generate-static-params` | Remove `generateStaticParams` (rule 6 in plan.md). |
| Build fails because the backend is down | Something calls the backend at build time (usually `generateStaticParams` or `sitemap.ts` without `try/catch`). |
| Markers do not render or the console warns about a Map ID | `AdvancedMarker` needs `mapId`; use `NEXT_PUBLIC_GOOGLE_MAP_ID` or `DEMO_MAP_ID`. |
| `Cannot find module './x'` in the backend | ESM: relative imports need the `.js` extension. |
| Prisma types missing after a schema change | Run `npx prisma generate` (migrations run it automatically). |
| zod v3 syntax errors | Both apps use zod v4: `z.email()` exists, errors are in `error.issues`, `z.ZodType` instead of `ZodTypeAny`. |
| Cookie not sent from the browser | The request must use `credentials: "include"` (always true in `apiFetch`), and `CORS_ORIGIN` must equal the frontend origin exactly. |
