# Plan: HematDekat (Cheap Staples Map, Indonesia)

HematDekat is a Next.js web app for finding where staple groceries (sembako) are cheapest in Indonesia. Users browse a map of stores and traditional markets, compare crowdsourced prices per product, report prices and promos, and confirm prices that are still correct. The frontend (`frontend/`) talks to a separate NestJS service (`backend/`, PostgreSQL + Prisma + Google Places) over HTTP. All content, data, and assets are original; nothing is copied from cheapfoodmap.com. That site is only a reference for the general interaction pattern (a full-screen map with a synchronized list).

## How to use this file (agents read first)

1. Read [AGENTS.md](AGENTS.md) (rules and commands), then this file, then [docs/patterns.md](docs/patterns.md) (reference code for every repeated pattern).
2. Open the "Status" checklist at the bottom. Work on the **first unchecked sub-step** (for example `C2.3`), unless the user names a different one. Do exactly one sub-step per session unless the user asks for more.
3. Every sub-step has:
   - **Do:** the exact tasks, in order.
   - **Do not:** things that look related but belong to another step. Never do them early.
   - **Files:** the files you may create or change. Touching other files needs a reason written in your final message.
   - **Verify:** commands and checks with the expected result. A sub-step is done only when every check passes.
4. When code and this plan disagree, the plan wins, except for facts about library versions; then follow the library and update the plan in the same change.
5. If something is not specified, look in "Implementation rules" and "Decisions". If it is still not specified, stop and ask the user. Never guess on data shapes, URLs, names, or security.
6. After finishing a sub-step: tick it in "Status", remove the audit rows it fixed, and update "API contract" if a shape changed.
7. Phase D (post-MVP) must not start until every Phase C sub-step is ticked and the user approves the C13 checkpoint.

## Language and naming

- Product name in the UI and metadata: **HematDekat**. Tagline: "Cari sembako termurah di dekatmu". The repository folder is `murah-dekat`; that is fine.
- English for documentation, code, identifiers, comments, commit messages, and API contracts.
- The UI is in Bahasa Indonesia through `next-intl`. Message keys are English; strings live in `frontend/messages/id.json`.
- Currency is IDR. Format only with the helpers in `frontend/lib/format.ts`.

## Decisions

- Concept: a map of grocery stores, minimarkets, supermarkets, and traditional markets (pasar) with crowdsourced staple prices and promos.
- Frontend: Next.js 16.4 (App Router, `cacheComponents: true`, `partialPrefetching: true`) + React 19 + TypeScript strict + Tailwind v4. Next 16 differs from older versions; read `frontend/node_modules/next/dist/docs/` before using an API you have not used in this repo.
- Backend: NestJS 12 + TypeScript (ESM: relative imports end in `.js`), port 3001. Lint with oxlint, tests with Vitest.
- Database: PostgreSQL 16 + Prisma 7 (`prisma.config.ts`, `@prisma/adapter-pg`; the datasource URL is set in `prisma.config.ts`, not in `schema.prisma`). Docker Compose on host port 5433.
- Validation: zod **v4** in both apps (`zod@^4.6.7`).
- Google Places: **Places API (New)** only (`https://places.googleapis.com/v1/...`). Exact requests are in [docs/patterns.md](docs/patterns.md#places-api-new).
- Auth: NestJS owns authentication with Passport.js (Google OAuth2 and local email/password with argon2). On success NestJS sets a JWT in an `httpOnly`, `SameSite=Lax`, `Secure` (production only) cookie named `access_token`, valid 7 days.
- Admin: a single admin account (role `ADMIN` for the email in `ADMIN_EMAIL`), created only by the seed script.
- Moderation: every new price report and promo starts as `PENDING` and is public only after an admin sets it to `APPROVED`.
- Region: Indonesia, five cities: Jakarta, Bandung, Yogyakarta, Surabaya, Medan.
- Staple products (seeded; slug in brackets): Beras premium (`beras-premium`, kg), Minyak goreng curah (`minyak-goreng-curah`, liter), Gula pasir (`gula-pasir`, kg), Telur ayam (`telur-ayam`, pcs), Tepung terigu (`tepung-terigu`, kg), Garam (`garam`, kg), Mie instan (`mie-instan`, pack), Cabai merah (`cabai-merah`, kg), Bawang merah (`bawang-merah`, kg), Bawang putih (`bawang-putih`, kg), Ayam broiler (`ayam-broiler`, kg), Daging sapi (`daging-sapi`, kg), Ikan bandeng (`ikan-bandeng`, kg).
- Ratings and photos: never on list cards or map pins. Only the store detail page fetches rating and one photo fresh from Places through the backend.
- Activity feed UI: not part of the MVP. The backend keeps writing `Activity` rows (used later by Phase D).
- Design: dark slate with emerald accents. Exact tokens are in "Design system".

## Implementation rules

These rules answer the questions an implementer would otherwise guess. Follow them exactly.

### Frontend rendering and data

1. **Server components never read cookies and never call authenticated endpoints.** Only public data (`/cities`, `/products`, `/stores`, `/stores/:slug`, `/stores/:slug/place-details`, `/products/:slug`) is fetched on the server.
2. **Everything that needs a session runs in client components in the browser** (`/auth/*`, `POST` endpoints, `/admin/*`, `/places/*`), through `lib/api-client.ts` with `credentials: "include"`. The browser sends the `access_token` cookie to the backend directly.
3. **The current user** comes from a client `CurrentUserProvider` (in `app/layout.tsx`) that calls `GET /auth/me` once. `useCurrentUser()` returns `{ status: "loading" | "signed-out" | "signed-in", user, refresh }`. A 401 from `/auth/me` means `signed-out`, not an error.
4. **Protected pages** (`/report`, `/admin`) are client-gated: while `loading` show a skeleton; when `signed-out` call `router.replace("/login?next=" + encodeURIComponent(currentPathWithQuery))`; on `/admin` a signed-in non-admin sees a "no access" message. The backend still enforces every rule.
5. **Every async server component that fetches data is rendered inside `<Suspense>`**, and `params`/`searchParams` promises are awaited inside that boundary (see the existing `app/stores/[slug]/page.tsx`). Reading request data outside `<Suspense>` is a build error with `cacheComponents`.
6. **Do not use `"use cache"`, `cacheLife`, or `generateStaticParams` in the MVP.** Remove the existing `generateStaticParams` exports in C4.4 so `npm run build` never needs the backend. Server fetches use `cache: "no-store"`.
7. **Client components that call `useSearchParams()`** must be rendered inside `<Suspense>` by their parent page.
8. **Errors:** repository functions throw `ApiError` (`status`, `message`, `fieldErrors`). Server pages catch it: status 404 → `notFound()`; anything else → render `<ErrorState />`. Never fall back to mock data.
9. **URL state:** read with `parseSearchParams()` and write with `buildSearchParams()` from `lib/search-params.ts` and `router.replace(url, { scroll: false })`. Never build query strings by hand.

### Backend

1. **Error response format** (already produced by `ZodValidationPipe`, keep it): 400 → `{ "message": "Validation failed", "errors": [{ "path": "price", "message": "..." }] }`. Other errors use Nest's default `{ "statusCode", "message", "error" }`.
2. **Public queries return only `APPROVED` price reports and only `APPROVED` promos that are active now** (`validFrom <= now <= validTo`).
3. **A store is public** when it has at least one approved price report or one approved active promo. Other stores are not returned by `GET /stores` and return 404 from `GET /stores/:slug`.
4. **The current price of a product at a store** is its `APPROVED` report with the newest `verifiedAt` (tie: newest `createdAt`). Use this one report for cards, pins, the store page, sorting, and filtering.
5. **Enums in the API** are lowercase kebab-case and mapped in `backend/src/common/enums.ts`:
   - StoreType: `SUPERMARKET`↔`supermarket`, `MINIMARKET`↔`minimarket`, `MARKET`↔`market`, `GROCERY_STALL`↔`grocery-stall`.
   - ProductCategory: `RICE`↔`rice`, `COOKING_OIL`↔`cooking-oil`, `SUGAR`↔`sugar`, `EGGS`↔`eggs`, `FLOUR`↔`flour`, `SALT`↔`salt`, `INSTANT_NOODLES`↔`instant-noodles`, `CHILI`↔`chili`, `SHALLOTS`↔`shallots`, `GARLIC`↔`garlic`, `CHICKEN`↔`chicken`, `BEEF`↔`beef`, `FISH`↔`fish`.
   - ProductUnit: `KG`↔`kg`, `LITER`↔`liter`, `PCS`↔`pcs`, `PACK`↔`pack`, `TRAY`↔`tray`.
   - ReportStatus: `PENDING`↔`pending`, `APPROVED`↔`approved`, `REJECTED`↔`rejected`.
6. **Dates** are ISO 8601 strings in UTC (`date.toISOString()`).
7. **Pagination** is offset-based: `offset` (default 0) and `limit` (default 50, max 100). Responses are `{ items, total, offset, limit }`.
8. **Store search in `GET /stores`:** query Prisma with the cheap filters (city, bbox, type, `q` on store name or district, public-store rule) and `take: 1000`, include the current price for the selected product and the active promo count, then in TypeScript: compute distance, apply `maxPrice`, `fresh`, `promo`, sort, and slice `offset`/`limit`. Do not write raw SQL.
9. **Distance** is the haversine distance in km, rounded to 1 decimal, computed in `backend/src/common/geo.ts`.
10. **Slugs** come from `slugify()` in `backend/src/common/slugify.ts` (move the existing function from `prisma/seed.ts` there and import it in the seed). New store slug: `slugify(name + " " + (district ?? cityName))`; if taken, append `-2`, `-3`, and so on.
11. **Assigning a city to a new store:** the nearest `City` center by haversine. If the nearest center is more than 50 km away, reject with 422 `{ "message": "Store is outside supported cities" }`.
12. **District of a new store:** from Places `addressComponents`, the `longText` of the first component whose `types` include `administrative_area_level_3`, else `administrative_area_level_4`, else `null`.
13. **Store type of a new store:** the user's choice in the form (required). The form pre-selects a value with this mapping from Places `primaryType`/`types`: `supermarket` or `hypermarket` → `supermarket`; `convenience_store` → `minimarket`; `market` or `farmers_market` → `market`; anything else → `grocery-stall`. Then by name (case-insensitive): contains `pasar` → `market`; contains `alfamart`, `indomaret`, `alfamidi`, `circle k`, `lawson` → `minimarket`; contains `superindo`, `super indo`, `hypermart`, `transmart`, `lotte`, `giant`, `hero`, `foodmart`, `farmers market` → `supermarket`.
14. **Google Maps link:** `https://www.google.com/maps/search/?api=1&query=<lat>,<lng>&query_place_id=<placeId>`. It works even when `placeId` is not a real Google id (seed data).
15. **Places failures never break a page:** on any non-2xx or network error from Google, `GET /stores/:slug/place-details` returns 200 `{ "available": false }`.
16. **Never send the Places server key to the browser.** Photo URLs are resolved server-side with `skipHttpRedirect=true`, and only the returned `photoUri` (a `googleusercontent.com` URL without a key) is sent.

## Domain model

Current Prisma schema (`backend/prisma/schema.prisma`):

- `City`: slug, name, province, `centerLat`, `centerLng`.
- `Store`: slug, name, `placeId` (unique), `type`, city, `district` (optional), cached `lat`/`lng` with `fetchedAt`.
- `Product`: slug, name, `category`, `defaultUnit`.
- `User`: email, name, `passwordHash` (local), `googleId` (Google), `role` (`USER`, `ADMIN`).
- `PriceReport`: store, product, reporter, `price` (int rupiah, pack price), `quantity` (in the product's `defaultUnit`), `unit`, `normalizedUnitPrice` (int rupiah per `defaultUnit`), `status`, `verifiedAt`, `confirmationCount`.
- `Promo`: store, product, submitter, `promoPrice` (int) or `discountPct`, `conditions`, `validFrom`, `validTo`, `status`.
- `Vote`: a user confirms a price report or a promo. Unique per (user, priceReport) and per (user, promo).
- `Activity`: event log (`PRICE_REPORT_SUBMITTED`, `PRICE_REPORT_APPROVED`, `PRICE_REPORT_REJECTED`, `PROMO_SUBMITTED`, `PROMO_APPROVED`, `PROMO_REJECTED`, `VOTE_CAST`).

Schema changes, each in its own migration in the step that needs it:

| Step | Change | Migration name |
| --- | --- | --- |
| C11.2 | `PriceReport.flagged Boolean @default(false)`, `PriceReport.flagReason String?` | `price_report_flags` |
| D1 | `PointEvent` model | `point_events` |
| D3 | `SavedStore` model | `saved_stores` |

Promo confirmations are not stored as a column: `confirmationCount` for a promo is the number of its `Vote` rows (`_count`).

### Unit price rules

- Every product has one comparison unit: its `defaultUnit`. `normalizedUnitPrice = Math.round(price / quantity)`, with `quantity` in `defaultUnit`. The backend computes it; it ignores any client value.
- The report form converts convenient units to `defaultUnit` before submitting. Allowed input units per product unit:
  - `kg` products: `kg` (×1), `gram` (÷1000), `ons` (÷10).
  - `liter` products: `liter` (×1), `ml` (÷1000).
  - `pcs` products (eggs): `butir` (×1), `tray` (×30), `kg` (×16, an editable estimate shown in the form).
  - `pack` products: `pack` (×1), `dus` (×40).
- The API accepts only `unit === product.defaultUnit` (422 otherwise) and `quantity` with at most 3 decimals.
- Money is always integer rupiah. `price` must be between 100 and 10,000,000.
- Freshness uses `verifiedAt` (set on approval, refreshed on each confirmation vote): `fresh` ≤ 3 days, `recent` ≤ 14 days, `stale` > 14 days. Labels: "Baru diverifikasi", "Diverifikasi X hari lalu", "Perlu dicek ulang".

## API key security

- Never write an API key into code, docs, or commits. Keys go only in `frontend/.env.local` and `backend/.env`, both git-ignored.
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: browser key, restricted by HTTP referrer, Maps JavaScript API only.
- `GOOGLE_PLACES_SERVER_KEY`: server key, restricted by IP and to Places API (New), used only by the backend.
- Google login uses a separate OAuth client (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`).
- `frontend/.env.example` lists only frontend variables; `backend/.env.example` only backend variables. `git grep AIza` must return nothing.
- Set a budget alert and quota caps in Google Cloud. Each store page view costs one Place Details call and one Place Photo call.

## Google Places notes

- Only `place_id` may be stored indefinitely. Coordinates and the cached store name may be kept at most 30 days; `fetchedAt` records the last refresh. A refresh job is out of MVP scope; note it in the deployment notes (C13.4).
- Places has no price data. Prices and promos come from users.
- Places is used for: autocomplete and details in the report form (C9), fresh rating and photo on the store page (C7), and the optional import script.
- Seed stores have fake `placeId` values (for example `jakarta-pasar-kramat-jati`). Places calls for them fail; rule 15 above handles it.

## Current state audit (2026-10-31)

Phase A and B were done as a first pass. The app runs, but many items were checked off without being implemented. Each row names the sub-step that fixes it. Remove a row when you fix it.

Frontend (`frontend/`):

| Area | Current state | Fixed in |
| --- | --- | --- |
| Home page | Dashboard cards with a 420px map; no split view or mobile toggle; product list hardcoded; "Lihat semua" does nothing; cards do not link to store pages | C5 |
| Filters | No search, filters, sort, URL query params, or geolocation | C6 |
| City page | Name derived from the slug; filters all stores client-side; no map | C7.2 |
| Login | "Masuk dengan email" does nothing; no sign-up page | C8 |
| Votes | No confirm-price button | C10 |
| Static/SEO | No about/privacy/terms/feedback pages, sitemap, robots, OG image, manifest; `public/` has Next.js template SVGs | C12 |

Backend (`backend/`):

| Area | Current state | Fixed in |
| --- | --- | --- |
| Places | `places.controller.ts` and `prisma/import-places.ts` use legacy endpoints | C3.6 (controller), C13.4 (script: document or migrate) |
| Write endpoints | No `POST /auth/register`, `/price-reports`, `/promos`, `/votes` | C8.1, C9.1, C10.1 |
| Rate limiting | Hand-written in-memory limiter for login only; `@nestjs/throttler` not installed | C11.1 |

Repository files:

- `plan.md` and `AGENTS.md` stay in the root `.gitignore`. Do not remove those lines.

## Design system

Use these Tailwind classes; do not invent new colors or radii. Base components in `components/ui/` encode them (C2.6).

| Token | Classes |
| --- | --- |
| Page background | `bg-slate-950 text-slate-100` (set on `<body>`) |
| Surface (cards, panels) | `bg-slate-900 border border-white/10` |
| Raised (inputs, chips, nested cards) | `bg-slate-800 border border-white/10` |
| Text | primary `text-white`, body `text-slate-200`, muted `text-slate-400` |
| Accent | `text-emerald-300`, `bg-emerald-500`, `border-emerald-400` |
| Danger / warning | `text-red-200 bg-red-500/10 border-red-500/30` / `text-amber-200 bg-amber-500/10 border-amber-500/30` |
| Radius | panels `rounded-3xl`, cards `rounded-2xl`, inputs `rounded-xl`, buttons/chips/badges `rounded-full` |
| Page container (not home) | `mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8` |
| Headings | page `text-2xl font-bold text-white sm:text-3xl`; section `text-lg font-semibold text-white`; eyebrow `text-xs uppercase tracking-[0.2em] text-emerald-400` |
| Buttons | primary `bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-semibold`; secondary `bg-slate-800 border border-white/10 text-slate-200 hover:border-emerald-400`; ghost `text-slate-300 hover:text-white`. Sizes: `sm` = `px-3 py-1.5 text-sm`, `md` = `px-4 py-2 text-sm` |
| Focus (all interactive elements) | `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400` |
| Freshness badge | fresh `bg-emerald-500/10 text-emerald-300`; recent `bg-amber-500/10 text-amber-200`; stale `bg-slate-700 text-slate-300` |
| Map pin | default `rounded-full bg-emerald-500 px-2 py-1 text-xs font-bold text-white shadow`; hovered `bg-emerald-400`; selected `bg-white text-slate-950 ring-2 ring-emerald-400 scale-110 z-10`; no price `h-3 w-3 rounded-full bg-slate-500 ring-2 ring-white` |
| Font | keep Geist from `next/font/google` |

## Target UX

### Home page (`/`)

Desktop (`lg`, ≥ 1024px):

- Global header (from the layout): logo "HematDekat", nav links (Kota, Laporkan harga), user menu or "Masuk". Height 64px.
- Toolbar under the header (inside the home page): search input, city select, "Cari di sekitar saya" button, "Filter" button, then a horizontally scrollable product chip row. Products come from `GET /products`.
- Below the toolbar, the rest of the viewport (`h-[calc(100dvh-64px-<toolbar>)]`, use a flex column with `flex-1 min-h-0` instead of hardcoding heights) is split: list on the left (`w-[400px]`, scrolls independently), map on the right (`flex-1`).
- Pins: pill with the selected product's unit price ("Rp14.700/kg"); stores without a price get the small grey dot.
- Hovering a card highlights its pin. Clicking a pin selects it, scrolls its card into view (`scrollIntoView({ block: "nearest", behavior: "smooth" })`), and opens an info window (name, unit price, freshness badge, "Lihat toko" link). Clicking a card selects it and pans the map to it.
- After the user pans or zooms, a "Cari di area ini" button appears at the top center of the map. Clicking it writes `bbox` to the URL. There is no automatic refetch on pan.

Mobile (< 1024px):

- Same toolbar; below it the map fills the screen. A floating button at the bottom center toggles "Tampilkan daftar" / "Tampilkan peta". The toggle state is local (not in the URL).
- The filter panel opens as a bottom sheet (fixed, `max-h-[80dvh]`, scrollable, closes on backdrop click and Escape).

States: list skeleton (6 cards) while loading; empty state "Belum ada harga untuk produk ini di area ini." with a "Laporkan harga" button; error state "Gagal memuat data." with a "Coba lagi" button (`router.refresh()`). Never show mock data.

### URL query parameters (home and city pages)

Parsed with zod in `frontend/lib/search-params.ts`. Invalid values are dropped silently (the default applies). Defaults are not written to the URL.

| Param | Type | Default | Meaning |
| --- | --- | --- | --- |
| `product` | product slug | `beras-premium` (or the first product if missing) | Product on pins and used for price sort/filter |
| `q` | string, 1–60 chars | none | Store name or district contains (case-insensitive) |
| `city` | city slug | none | Restrict to one city (home page only; the city page sets it implicitly) |
| `type` | comma list of `supermarket`, `minimarket`, `market`, `grocery-stall` | all | Store types |
| `maxPrice` | int 1–10,000,000 | none | Maximum unit price for `product` |
| `promo` | `1` | off | Only stores with an active approved promo |
| `fresh` | `3`, `14`, or `30` | none | Only prices verified within N days |
| `sort` | `cheapest`, `nearest`, `recent` | `cheapest` | `nearest` without `lat`/`lng` behaves like `cheapest` |
| `lat`, `lng` | numbers in Indonesia's range (lat −11…6, lng 95…141) | none | User location |
| `bbox` | `south,west,north,east` (4 numbers) | none | Visible map bounds after "Cari di area ini" |

## API contract

Base URL: `NEXT_PUBLIC_API_URL` in the browser; on the server `BACKEND_INTERNAL_URL` if set, else `NEXT_PUBLIC_API_URL`. Every request uses `credentials: "include"`. Bodies and query params are validated with zod (error format in "Implementation rules").

Response types (backend: `backend/src/common/dto.ts`; frontend: zod schemas in `frontend/lib/data/types.ts` with the same names):

```ts
type StoreType = "supermarket" | "minimarket" | "market" | "grocery-stall";
type ProductUnit = "kg" | "liter" | "pcs" | "pack" | "tray";

type City = {
  slug: string;
  name: string;
  province: string;
  centerLat: number;
  centerLng: number;
  storeCount: number;            // public stores only
};

type Product = {
  slug: string;
  name: string;
  category: string;              // lowercase kebab-case, see enum mapping
  defaultUnit: ProductUnit;
};

type PriceSummary = {
  priceReportId: string;
  productSlug: string;
  productName: string;
  unit: ProductUnit;
  price: number;                 // pack price, int rupiah
  quantity: number;
  normalizedUnitPrice: number;   // int rupiah per unit
  verifiedAt: string;            // ISO; never null for approved reports (C3.5 guarantees it)
  confirmationCount: number;
};

type StoreSummary = {
  id: string;
  slug: string;
  name: string;
  type: StoreType;
  city: { slug: string; name: string };
  district: string | null;
  lat: number;
  lng: number;
  distanceKm: number | null;     // only when lat/lng were sent
  price: PriceSummary | null;    // current price for the requested product
  hasActivePromo: boolean;
};

type PromoSummary = {
  id: string;
  productSlug: string;
  productName: string;
  promoPrice: number | null;
  discountPct: number | null;
  conditions: string | null;
  validFrom: string;
  validTo: string;
  confirmationCount: number;     // number of votes
};

type StoreDetail = Omit<StoreSummary, "price" | "distanceKm"> & {
  placeId: string;
  prices: PriceSummary[];        // current price per product, sorted by product name
  promos: PromoSummary[];        // approved and active, sorted by validTo ascending
  googleMapsUrl: string;
};

type PlaceDetails =
  | { available: false }
  | {
      available: true;
      name: string;
      rating: number | null;
      userRatingCount: number | null;
      formattedAddress: string | null;
      photo: { uri: string; attributions: { displayName: string; uri: string | null }[] } | null;
    };

type ProductDetail = {
  product: Product;
  cheapest: StoreSummary[];      // up to 20, sort=cheapest, optional ?city=
  cityAverages: { citySlug: string; cityName: string; averageUnitPrice: number; reportCount: number }[];
};

type PlaceSuggestion = { placeId: string; mainText: string; secondaryText: string | null };

type PlaceLookup = {
  placeId: string;
  name: string;
  lat: number;
  lng: number;
  formattedAddress: string | null;
  district: string | null;
  suggestedType: StoreType;
  existingStoreSlug: string | null;  // set when the placeId is already in our database
};

type PendingItem = {
  kind: "price-report" | "promo";
  id: string;
  store: { slug: string; name: string };
  product: { slug: string; name: string; defaultUnit: ProductUnit };
  submittedBy: string;           // user name, or the part of the email before "@"
  price: number | null;          // price reports
  quantity: number | null;
  normalizedUnitPrice: number | null;
  promoPrice: number | null;     // promos
  discountPct: number | null;
  validFrom: string | null;
  validTo: string | null;
  flagged: boolean;              // true for price-report outliers vs. the recent median (C11.2); always false for promos
  flagReason: string | null;
  createdAt: string;
};

type CurrentUser = { id: string; email: string; name: string | null; role: "user" | "admin" };

type Page<T> = { items: T[]; total: number; offset: number; limit: number };
```

Endpoints:

| Method | Path | Auth | Built in | Request | Response |
| --- | --- | --- | --- | --- | --- |
| GET | `/cities` | public | C3.4 | none | `City[]` sorted by name |
| GET | `/cities/:slug` | public | C3.4 | none | `City` or 404 |
| GET | `/products` | public | C3.4 | none | `Product[]` sorted by name |
| GET | `/products/:slug` | public | C7.3 | `?city=` | `ProductDetail` or 404 |
| GET | `/stores` | public | C3.4 (basic), C6.4 (all params) | URL params table + `offset`, `limit` | `Page<StoreSummary>` |
| GET | `/stores/:slug` | public | C3.4 | none | `StoreDetail` or 404 |
| GET | `/stores/:slug/place-details` | public | C7.1 | none | `PlaceDetails` |
| GET | `/places/autocomplete` | user | C3.6 | `?input=` (3–100 chars) `&sessionToken=` (uuid) `&lat=&lng=` (optional bias) | `PlaceSuggestion[]` (max 5) |
| GET | `/places/details` | user | C3.6 | `?placeId=&sessionToken=` | `PlaceLookup` |
| POST | `/auth/register` | public | C8.1 | `{ email, password, name }` | 201 `CurrentUser` + cookie; 409 if the email exists |
| POST | `/auth/login` | public | existing | `{ email, password }` | 200 `CurrentUser` + cookie; 401 |
| GET | `/auth/google` | public | existing | none | redirect to Google |
| GET | `/auth/google/callback` | public | existing | none | redirect to `CORS_ORIGIN/login?auth=google-success` |
| GET | `/auth/me` | user | C3.1 | none | `CurrentUser` (loaded from the database); 401 when signed out |
| POST | `/auth/logout` | public | existing | none | 200 `{ ok: true }`, clears cookie |
| POST | `/price-reports` | user | C9.1 | `{ storeSlug? , placeId?, storeType?, productSlug, price, quantity, unit }` (exactly one of `storeSlug` or `placeId`; `storeType` required with `placeId`) | 201 `{ id, status: "pending" }`; 422 outside supported cities or wrong unit |
| POST | `/promos` | user | C9.2 | `{ storeSlug?, placeId?, storeType?, productSlug, promoPrice?, discountPct?, conditions?, validFrom, validTo }` (exactly one of `promoPrice` 100–10,000,000 or `discountPct` 1–90; `validTo >= validFrom`; `validTo` within 90 days; `conditions` ≤ 200 chars) | 201 `{ id, status: "pending" }` |
| POST | `/votes` | user | C10.1 | `{ priceReportId }` or `{ promoId }` | 201 `{ confirmationCount, verifiedAt }` (`verifiedAt` null for promos); 403 own item; 404 not approved; 409 duplicate |
| GET | `/admin/pending` | admin | C3.2 | none | `{ items: PendingItem[] }` (flagged first, then newest) |
| PATCH | `/admin/price-reports/:id/status` | admin | C3.2 | `{ status: "approved" | "rejected" }` | `{ id, status }` |
| PATCH | `/admin/promos/:id/status` | admin | C3.2 | `{ status: "approved" | "rejected" }` | `{ id, status }` |

## Steps

### Phase A and B (first pass, done)

Steps 1 to 13 of the original plan were completed as a first pass (scaffold, mock data, prototype map page, city/store/product pages, report and login stubs, NestJS scaffold, Prisma schema and migration, auth module, read-only controllers, Places proxy, HTTP repository, seed and import scripts, admin moderation). Their gaps are listed in the audit and fixed in Phase C.

### Phase C: Make the MVP real

Order: C2 and C3 can be done in either order; everything else follows the "Depends on" lines.

#### C1. Docs and environment hygiene (done)

Rewrote `plan.md`, `AGENTS.md`, `README.md`, `frontend/.env.example`; added `docs/patterns.md`.

#### C2. Frontend foundation

Depends on: C1. Applies to `frontend/` only.

**C2.1 Install dependencies and i18n**
- Do:
  1. `npm install next-intl@^4 zod@^4.6.7` and `npm install -D eslint-plugin-i18next@^6`.
  2. Create `i18n/request.ts`, wrap `next.config.ts` with `createNextIntlPlugin()`, and wrap `{children}` in `app/layout.tsx` with `<NextIntlClientProvider>` exactly as in [docs/patterns.md](docs/patterns.md#next-intl-setup).
  3. Create `messages/id.json` with the top-level groups `common`, `header`, `footer`, `home`, `filters`, `map`, `store`, `city`, `product`, `report`, `auth`, `admin`, `errors`, `freshness`, `storeType`, `units`. Start with `common.appName = "HematDekat"` and `common.tagline = "Cari sembako termurah di dekatmu"`.
  4. Add the `i18next/no-literal-string` rule to `eslint.config.mjs` as in [docs/patterns.md](docs/patterns.md#lint-rule-for-hardcoded-strings), set to `"warn"` for now.
- Do not: move strings yet (C2.2); change any layout or styling.
- Files: `package.json`, `package-lock.json`, `next.config.ts`, `i18n/request.ts`, `messages/id.json`, `app/layout.tsx`, `eslint.config.mjs`.
- Verify: `npm run lint` (warnings allowed, no errors), `npm run typecheck`, `npm run build` pass; `npm run dev` and `/` still renders.

**C2.2 Move all UI strings into `messages/id.json`**
- Do:
  1. Replace every user-facing string in `app/**/*.tsx` and `components/**/*.tsx` (text, `placeholder`, `aria-label`, `title`, `alt`, metadata titles/descriptions) with `useTranslations` (client and sync server components) or `await getTranslations` (async server components and `generateMetadata`).
  2. Key names: `<group>.<camelCaseKey>`, for example `header.reportPrice`, `store.openInGoogleMaps`. Use ICU placeholders for values: `"verifiedDaysAgo": "Diverifikasi {days} hari lalu"`.
  3. Change the lint rule from `"warn"` to `"error"`.
- Do not: rename components or change markup beyond replacing strings.
- Files: `messages/id.json`, `app/**/*.tsx`, `components/**/*.tsx`, `eslint.config.mjs`.
- Verify: `npm run lint` passes with the rule at `"error"`; `npm run typecheck`; visual check that pages show the same Indonesian text as before.

**C2.3 Format helpers**
- Do: create `lib/format.ts` with exactly these exports and unit tests in `tests/format.test.ts` (see [docs/patterns.md](docs/patterns.md#format-helpers)):
  - `formatRupiah(value: number): string` → `"Rp14.700"` (no space after `Rp`, normalize the non-breaking space from `Intl` away).
  - `formatUnitPrice(value: number, unitLabel: string): string` → `"Rp14.700/kg"`. The label comes from messages (`units.kg` = "kg", `units.liter` = "liter", `units.pcs` = "butir", `units.pack` = "bungkus", `units.tray` = "tray"), so callers pass `t(\`units.${unit}\`)`.
  - `daysSince(iso: string, now?: Date): number` (whole days, floor, never negative).
  - `freshnessLevel(iso: string, now?: Date): "fresh" | "recent" | "stale"`.
  Replace every `Intl.NumberFormat` and `toLocaleString("id-ID")` call in `app/` and `components/` with these helpers.
- Do not: build the freshness badge component (C2.6).
- Files: `lib/format.ts`, `tests/format.test.ts`, files that used `Intl.NumberFormat`.
- Verify: `npm run test` passes; `rg -n "Intl.NumberFormat|toLocaleString" app components` returns nothing.

**C2.4 Shared layout**
- Do:
  1. `app/layout.tsx`: `<html lang="id">`, body classes from "Design system", render `<AppHeader />`, `<main className="flex-1">{children}</main>`, `<AppFooter />` inside the providers. Root `metadata`: title template `"%s | HematDekat"`, default title `"HematDekat"`, description = tagline.
  2. `components/app-header.tsx`: no props. Logo link to `/`, links "Kota" (`/cities`) and "Laporkan harga" (`/report`), and `<UserMenu />` (C2.5). Mobile (< `sm`): links collapse into a menu button.
  3. `components/app-footer.tsx`: copyright line and links to `/about`, `/privacy`, `/terms`, `/feedback` (pages arrive in C12; links may 404 until then).
  4. Remove the page-level `<header>`/"Kembali" link blocks that duplicate the global navigation; keep page titles.
- Do not: redesign the home page body (C5).
- Files: `app/layout.tsx`, `components/app-header.tsx`, `components/app-footer.tsx`, pages that render their own header.
- Verify: lint, typecheck, build pass; every route shows the same header and footer.

**C2.5 API client and current user**
- Do:
  1. Rewrite `lib/api-client.ts` as in [docs/patterns.md](docs/patterns.md#api-client): `apiFetch(path, { method, body, schema, signal })`, `ApiError`, base URL selection (browser vs server), JSON body handling, 204 handling.
  2. Create `components/current-user-provider.tsx` (client) with `CurrentUserProvider` and `useCurrentUser()` (see rule 3 in "Frontend rendering and data"). Add it to `app/layout.tsx`.
  3. Create `components/user-menu.tsx`: loading → small skeleton; signed-out → "Masuk" link to `/login`; signed-in → name (or email prefix), "Admin" link only when `role === "admin"`, "Keluar" button (`POST /auth/logout`, then `refresh()` and `router.refresh()`).
  4. Remove every direct `fetch` call and `backendBaseUrl` constant from `app/`.
- Do not: build the email login form (C8.2) or change admin page behavior beyond using `apiFetch`.
- Files: `lib/api-client.ts`, `lib/data/types.ts` (only `CurrentUser` schema for now), `components/current-user-provider.tsx`, `components/user-menu.tsx`, `components/app-header.tsx`, `app/layout.tsx`, `app/page.tsx`, `app/login/page.tsx`, `app/admin/page.tsx`.
- Verify: `rg -n "fetch\(" app components` returns nothing; signing in with Google (or setting a cookie) shows the user name; "Keluar" signs out.

**C2.6 Base UI components**
- Do: create in `components/ui/`: `button.tsx` (`variant`: primary/secondary/ghost, `size`: sm/md; renders `<button>` or Next `<Link>` when `href` is given), `badge.tsx`, `freshness-badge.tsx` (uses `freshnessLevel` and `daysSince`), `empty-state.tsx` (`title`, `description?`, `action?`), `error-state.tsx` (client component; `title?`, `onRetry?`; without `onRetry` the button calls `router.refresh()`, see [docs/patterns.md](docs/patterns.md#error-state)), `skeleton.tsx`, `text-field.tsx` (label linked with `htmlFor`/`id` via `useId`, error text with `aria-describedby`). Classes come from "Design system". Use them in existing pages where an equivalent element exists.
- Do not: create feature components (store list, filters, and so on).
- Files: `components/ui/*`, existing pages and components.
- Verify: lint, typecheck, test, build pass.

#### C3. Backend correctness fixes

Depends on: C1. Applies to `backend/` only.

**C3.1 Auth hardening**
- Do:
  1. Remove the constructor call to `ensureSeedAdmin()`, the method itself, and the in-memory `users` map from `AuthService`. Make `PrismaService` and `JwtService` required constructor dependencies. The admin is created only by `prisma/seed.ts`.
  2. On startup (`main.ts`), throw if `JWT_SECRET` is missing or shorter than 32 characters. Remove the `'dev-secret'` fallbacks.
  3. JWT and cookie lifetime: 7 days (`expiresIn: "7d"`, cookie `maxAge: 7 * 24 * 60 * 60 * 1000`).
  4. `GET /auth/me` loads the user from the database by `sub` and returns `CurrentUser` (role lowercase). `POST /auth/login` returns `CurrentUser`. `POST /auth/logout` clears the cookie with the same options used to set it and returns `{ ok: true }`.
  5. `main.ts`: default port `3001`.
  6. Update `auth.service.spec.ts` to the new constructor (mock Prisma and JWT like the existing admin test).
- Do not: add register (C8.1) or throttling (C11.1). Keep the existing login limiter until C11.1.
- Files: `src/auth/*`, `src/main.ts`, `.env.example` (comment for `JWT_SECRET` length).
- Verify: `npm run lint`, `npm run test`, `npm run build`; starting without `JWT_SECRET` fails with a clear message; restarting the backend does not change the admin password.

**C3.2 Roles guard and admin endpoints**
- Do: add `src/common/roles.decorator.ts` and `src/common/roles.guard.ts` as in [docs/patterns.md](docs/patterns.md#roles-guard); apply `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles("ADMIN")` on `AdminController`; delete `requireAdmin`; accept lowercase `"approved" | "rejected"` and map to Prisma enums; return `PendingItem` shapes; on approval set `verifiedAt = now`.
- Do not: add flag handling (C11.2).
- Files: `src/common/*`, `src/admin/*`.
- Verify: unit test for `RolesGuard` (admin passes, user gets 403, no user gets 403); `npm run test`; the admin page lists and approves items when signed in as the admin.

**C3.3 Feature modules**
- Do: for `stores`, `cities`, `products`, `places`, `admin`: create `<name>.module.ts` and `<name>.service.ts`, move Prisma queries from controllers into services, register modules in `AppModule` (import `PrismaModule` instead of providing `PrismaService` directly). Controllers only validate input and call services.
- Do not: change endpoint behavior in this sub-step.
- Files: `src/**`.
- Verify: `npm run lint`, `npm run test`, `npm run build`; `curl localhost:3001/cities` returns the same data as before.

**C3.4 DTOs and public visibility**
- Do:
  1. Create `src/common/enums.ts` (mapping functions both ways), `src/common/dto.ts` (types from "API contract" plus mapper functions such as `toStoreSummary`, `toPriceSummary`), `src/common/geo.ts` (`haversineKm`), `src/common/slugify.ts`.
  2. Apply rules 2, 3, 4 from "Implementation rules — Backend" in `StoresService`, `CitiesService` (`storeCount` counts public stores), and `ProductsService`.
  3. `GET /stores` for now supports `product`, `city`, `q`, `offset`, `limit` and returns `Page<StoreSummary>` sorted by name. C6.4 adds the rest.
  4. `GET /stores/:slug` returns `StoreDetail` with `googleMapsUrl` (rule 14).
- Do not: implement bbox, distance, filters, or sorts (C6.4).
- Files: `src/common/*`, `src/stores/*`, `src/cities/*`, `src/products/*`.
- Verify: unit tests for each mapper and for the "current price" selection; `npm run test`; `curl` shows lowercase enums and no pending reports.

**C3.5 Seed fixes**
- Do: import `slugify` from `src/common/slugify.ts`; set `verifiedAt` on every approved seed report (spread over the last 0–20 days, deterministic: `new Date(Date.now() - (index % 21) * 86_400_000)`); add 2 approved active promos (valid from yesterday for 14 days) on two different stores; read the admin password from `ADMIN_PASSWORD` (document it in `.env.example`, default only when `NODE_ENV !== "production"`).
- Do not: change products, cities, or stores.
- Files: `prisma/seed.ts`, `prisma/seed.spec.ts`, `.env.example`.
- Verify: `npx prisma migrate reset --force` reseeds without errors; `npm run test`.

**C3.6 Places API (New) proxy**
- Do: create `src/places/places.service.ts` with `autocomplete()` and `lookup()` exactly as in [docs/patterns.md](docs/patterns.md#places-api-new); controller returns `PlaceSuggestion[]` and `PlaceLookup` (district rule 12, type mapping rule 13, `existingStoreSlug`); both endpoints require `JwtAuthGuard`; when `GOOGLE_PLACES_SERVER_KEY` is empty return 503 `{ "message": "Places is not configured" }`.
- Do not: create stores here (C9.1).
- Files: `src/places/*`, `src/common/store-type-from-place.ts` (+ spec).
- Verify: unit tests for the type mapping and district extraction with fixture JSON; manual `curl` with a cookie and a real key returns suggestions.

**C3.7 Test database and e2e baseline**
- Do: create `backend/.env.test.example` (`DATABASE_URL=postgresql://postgres:postgres@localhost:5433/hematdekat_test?schema=public`, `JWT_SECRET` with 32+ chars); add `test/setup-e2e.ts` that loads `.env.test` with `dotenv` (`override: true`) and runs `prisma migrate reset --force` once; reference it in `vitest.config.e2e.ts` as `globalSetup`; replace the template test with e2e tests for: `GET /cities` shape, `GET /stores/:slug` never returns pending reports, admin endpoints return 401 signed out and 403 for a normal user.
- Do not: test write endpoints that do not exist yet.
- Files: `.env.test.example`, `test/*`, `vitest.config.e2e.ts`, `.gitignore` (ignore `.env.test`, already covered by `.env.*`).
- Verify: `cp .env.test.example .env.test && npm run test:e2e` passes with Docker Postgres running.

#### C4. Repository rewrite

Depends on: C2.5, C3.4. Applies to `frontend/`.

**C4.1 Types**
- Do: `lib/data/types.ts` with zod schemas for every type in "API contract" (names: `citySchema`, `productSchema`, `priceSummarySchema`, `storeSummarySchema`, `storeDetailSchema`, `placeDetailsSchema`, `productDetailSchema`, `placeSuggestionSchema`, `placeLookupSchema`, `pendingItemSchema`, `currentUserSchema`, `pageSchema(itemSchema)`) and `export type X = z.infer<typeof xSchema>`.
- Files: `lib/data/types.ts`.
- Verify: typecheck.

**C4.2 Repository functions**
- Do: rewrite `lib/data/repository.ts` with only async functions, each calling `apiFetch` with its schema (pattern in [docs/patterns.md](docs/patterns.md#repository-function)): `listCities()`, `getCity(slug)`, `listProducts()`, `getProduct(slug, citySlug?)`, `listStores(params: StoreSearchParams & { offset?, limit? })`, `getStore(slug)`, `getStorePlaceDetails(slug)`, `submitPriceReport(input)`, `submitPromo(input)`, `castVote(input)`, `autocompletePlaces(input, sessionToken, bias?)`, `lookupPlace(placeId, sessionToken)`, `listPendingItems()`, `setModerationStatus(kind, id, status)`. Delete `mockStores`, caches, and all sync `getX()` functions.
- Do not: change page layouts.
- Files: `lib/data/repository.ts`.
- Verify: typecheck (pages may fail until C4.4; do C4.2–C4.4 in one session if needed).

**C4.3 Tests and fixtures**
- Do: move sample data to `tests/fixtures/stores.ts` (valid `StoreSummary`/`StoreDetail` objects); rewrite `tests/repository.test.ts` to cover: valid response parsed, invalid response throws `ApiError`/zod error, 404 throws `ApiError` with status 404, network failure throws (no mock fallback).
- Files: `tests/*`.
- Verify: `npm run test`.

**C4.4 Pages use the new repository**
- Do: update `/`, `/cities`, `/cities/[slug]`, `/stores/[slug]`, `/products/[slug]`, `/admin` to the new functions and types; remove every `generateStaticParams`; apply rules 5, 6, 8 from "Frontend rendering and data". Keep current layouts (they are rebuilt in C5/C7).
- Files: `app/**`, `components/store-card.tsx`, `components/store-map.tsx`.
- Verify: lint, typecheck, test, build pass **with the backend stopped**; with the backend running, pages show seed data; with it stopped, pages show the error state.

#### C5. Home layout and map

Depends on: C4. Applies to `frontend/`.

**C5.1 Layout shell**
- Do: `app/page.tsx` becomes a server component: inside `<Suspense>` it awaits `searchParams`, parses them, loads `listProducts()`, `listCities()`, and `listStores(...)` in parallel, and renders `<HomeExplorer products cities initialPage params />` (client). `components/home/home-explorer.tsx` implements the desktop split and mobile toggle from "Target UX" with placeholder toolbar and list. Remove the old dashboard cards and "Lihat semua".
- Do not: add filters (C6) or clustering (C5.3).
- Files: `app/page.tsx`, `components/home/home-explorer.tsx`, `components/home/mobile-view-toggle.tsx`, `components/home/store-list.tsx`.
- Verify: desktop: list 400px left, map fills the rest, no page scroll; 375px: map full screen, toggle switches to the list and back.

**C5.2 Product selection and cards**
- Do: `ProductSelector` (move to `components/home/product-selector.tsx`) uses product slugs, shows names, writes `product` to the URL. `StoreCard` (move to `components/home/store-card.tsx`) shows: name, type badge (translated), district and city, unit price (`formatUnitPrice`) and pack price with quantity ("Rp72.000 / 5 kg"), `FreshnessBadge`, promo badge when `hasActivePromo`, distance when not null, "Belum ada harga" when `price` is null. The card is a `<Link href="/stores/[slug]">` with `onMouseEnter`/`onMouseLeave`/`onFocus` handlers for highlighting.
- Files: `components/home/*`, delete the old `components/product-selector.tsx` and `components/store-card.tsx` after moving (ask the user first, per AGENTS.md).
- Verify: changing the product updates the URL, cards, and the "cheapest first" order.

**C5.3 Map, pins, clustering, sync**
- Do: `npm install @googlemaps/markerclusterer@^2`. Move `store-map.tsx` to `components/map/store-map.tsx`; add `components/map/price-pin.tsx` and `components/map/store-info-window.tsx`. Cluster markers as in [docs/patterns.md](docs/patterns.md#map-clustering). Replace the hardcoded `mapId="sembako-map"` with `process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "DEMO_MAP_ID"` (the variable is already in `.env.example`). `HomeExplorer` owns `hoveredStoreId` and `selectedStoreId`; both the list and the map read and set them (behavior in "Target UX"). Initial center: the selected city's center at zoom 12, else Indonesia (`{ lat: -2.5, lng: 118 }`, zoom 5). Missing API key keeps the existing placeholder message (translated).
- Do not: add the "Cari di area ini" button (C6.3).
- Files: `components/map/*`, `components/home/home-explorer.tsx`, `package.json`.
- Verify: clusters appear at zoom 5 and split when zooming in; hovering a card highlights its pin; clicking a pin scrolls to and highlights the card and opens the info window; clicking a card pans to the pin.

#### C6. Search, filters, sort, and geolocation

Depends on: C5. Touches both apps.

**C6.1 URL state helpers**
- Do: `lib/search-params.ts` with `storeSearchParamsSchema`, `parseSearchParams(record)`, `buildSearchParams(params)` (omits defaults, sorts keys), and `tests/search-params.test.ts` covering every row of the URL table, including invalid values.
- Files: `lib/search-params.ts`, `tests/search-params.test.ts`.
- Verify: `npm run test`.

**C6.2 Toolbar and filter panel**
- Do: `components/filters/search-bar.tsx` (debounce 300ms, clears with an "×" button), `components/filters/city-select.tsx`, `components/filters/filter-panel.tsx` (store type checkboxes, max unit price input with thousand separators, promo toggle, freshness radio: semua/3/14/30 hari, sort radio; "Terapkan" and "Reset" buttons; side panel on desktop, bottom sheet on mobile), `components/filters/locate-me-button.tsx` (`navigator.geolocation.getCurrentPosition` with a 10s timeout; on success writes `lat`, `lng`, `sort=nearest`; on denial shows "Izin lokasi ditolak" inline). Sort option "Terdekat" is disabled without `lat`/`lng`.
- Files: `components/filters/*`, `components/home/home-explorer.tsx`.
- Verify: each control updates the URL; reload restores the same controls.

**C6.3 Search this area**
- Do: in `StoreMap`, after a user-initiated `dragend` or `zoom_changed`, show "Cari di area ini"; clicking it writes `bbox` from `map.getBounds()` (4 decimals). Selecting a city or using "Cari di sekitar saya" removes `bbox`.
- Files: `components/map/store-map.tsx`.
- Verify: pan, click the button, the list shows only stores in view.

**C6.4 Backend filters and sorting**
- Do: implement every URL param in `StoresService.search()` following rules 7, 8, 9 (sort details: `cheapest` by `price.normalizedUnitPrice` asc, `recent` by `price.verifiedAt` desc, `nearest` by `distanceKm` asc; stores without a price always last; tie-breaker name asc; `maxPrice` and `fresh` exclude stores without a price). Unit tests with an in-memory list for each filter and sort.
- Files: `backend/src/stores/*`, `backend/src/common/geo.ts`.
- Verify: `npm run test` in `backend/`; e2e test for `GET /stores?product=beras-premium&sort=cheapest`.

#### C7. Store, city, and product pages

Depends on: C4 (C7.2 also needs C6).

**C7.1 Store page**
- Do: backend `GET /stores/:slug/place-details` (rule 15, 16; fields from [docs/patterns.md](docs/patterns.md#places-api-new)). Frontend `/stores/[slug]`: header (name, type badge, district, city, "Buka di Google Maps" button with `target="_blank" rel="noopener noreferrer"`), price table (product, unit price, pack price + quantity, `FreshnessBadge`, confirmation count, an empty `<div data-slot="vote" />` cell for C10), active promos list, a small `StoreMap` with one pin (height 240px), a "Laporkan harga di toko ini" button (`/report?store=<slug>`), and Places info (rating "★ 4,5 (120 ulasan)", photo 16:9 with attributions under it, "Data dari Google Maps") in its own `<Suspense>`; render nothing when `available` is false. `generateMetadata`: title = store name, description = "Harga sembako terbaru di <name>, <city>.".
- Files: `backend/src/stores/*`, `backend/src/places/places.service.ts`, `frontend/app/stores/[slug]/page.tsx`, `frontend/components/store/*`.
- Verify: a seed store shows prices and promos without Places info; an unknown slug returns 404.

**C7.2 City pages**
- Do: `/cities`: grid of `City` cards (name, province, store count) linking to `/cities/[slug]`. `/cities/[slug]`: `getCity(slug)` (404 when missing), title "Harga sembako di <name>", intro text from `messages/id.json` (`city.intro.<slug>`, 2–3 original sentences per city), then `HomeExplorer` with `city` fixed and the city select hidden.
- Files: `app/cities/**`, `components/home/home-explorer.tsx` (a `lockedCity` prop), `messages/id.json`.
- Verify: `/cities/bandung` shows only Bandung stores and the map is centered on Bandung.

**C7.3 Product page**
- Do: backend `GET /products/:slug` (`ProductDetail`; `cityAverages` = average of current prices per city, rounded, only cities with ≥ 1 price). Frontend `/products/[slug]`: title "Harga <product> termurah", city filter (links with `?city=`), a table of `cityAverages`, and a list of the cheapest stores using `StoreCard`. Link product names on the store page to this page.
- Files: `backend/src/products/*`, `frontend/app/products/[slug]/page.tsx`.
- Verify: `/products/telur-ayam` lists stores sorted by unit price; `/products/unknown` is 404.

#### C8. Auth completion

Depends on: C2, C3.

**C8.1 Register endpoint**
- Do: `POST /auth/register` with zod (`email` valid and lowercased, `password` 8–72 chars, `name` 2–50 chars trimmed); 409 `{ message: "Email already registered" }`; argon2 hash; sets the cookie; returns `CurrentUser`. If the email exists only with `googleId` (no password), still 409 and the frontend suggests Google sign-in.
- Files: `backend/src/auth/*`.
- Verify: unit tests for success and 409; e2e test register → `GET /auth/me` returns the user.

**C8.2 Login and register pages**
- Do: `/login`: email/password form (`TextField`, submit button with loading state, inline error "Email atau kata sandi salah" on 401, "Terlalu banyak percobaan" on 429), the Google button, link to `/register`. `/register`: name, email, password, confirm password (client-side match check). Both read `next` (only values starting with `/` and not `//`; else `/`). After success: `refresh()` the current user, then `router.replace(next)`. For Google: before redirecting, store `next` in `sessionStorage` (`hematdekat:next`); on `/login?auth=google-success` read it, remove it, and redirect there.
- Files: `app/login/page.tsx`, `app/register/page.tsx`, `components/auth/*`, `messages/id.json`.
- Verify: register, log out, log in, wrong password error, Google flow returns to `/report` when started from `/report`.

**C8.3 Protected pages**
- Do: `components/auth/require-user.tsx` (client) implementing rule 4; wrap `/report` and `/admin` content with it (`/admin` with `role="admin"`).
- Files: `components/auth/require-user.tsx`, `app/report/page.tsx`, `app/admin/page.tsx`.
- Verify: signed out, `/report` redirects to `/login?next=%2Freport`; a normal user on `/admin` sees "Tidak punya akses".

#### C9. Report a price or promo

Depends on: C4, C8, C3.6.

**C9.1 Price report endpoint**
- Do: `POST /price-reports` per "API contract" in `src/price-reports/` (module, controller, service). With `placeId`: if a store with that `placeId` exists, use it; otherwise call `PlacesService.lookup`, apply rules 10–12, and create the store with `fetchedAt = now`. Check `unit === product.defaultUnit` (422 `{ message: "Unit must be <unit>" }`). Compute `normalizedUnitPrice`. Create the report (`PENDING`, `reporterId` from the JWT) and a `PRICE_REPORT_SUBMITTED` activity in one transaction.
- Files: `backend/src/price-reports/*`, `backend/src/app.module.ts`.
- Verify: unit tests (existing store, new store, outside cities 422, wrong unit 422); e2e: submit → appears in `GET /admin/pending` → approve → appears in `GET /stores/:slug`.

**C9.2 Promo endpoint**
- Do: `POST /promos` in `src/promos/`, same store resolution as C9.1 (extract it into `StoresService.resolveForSubmission()` and reuse), validation per "API contract", `PROMO_SUBMITTED` activity.
- Files: `backend/src/promos/*`, `backend/src/stores/stores.service.ts`.
- Verify: unit and e2e tests like C9.1.

**C9.3 Report page**
- Do: `/report` (inside `RequireUser`), two tabs "Harga" and "Promo" (`?tab=promo`), built from these components in `components/report/`:
  - `store-picker.tsx`: when `?store=<slug>` is present, show that store (from `getStore`) with a "Ganti toko" button. Otherwise an autocomplete input: create a `crypto.randomUUID()` session token when the input gets focus; call `autocompletePlaces` after 300ms debounce and 3+ characters; show up to 5 suggestions (keyboard: arrows, Enter, Escape; `role="combobox"`/`listbox`); on select call `lookupPlace` with the same token, then start a new token. If `existingStoreSlug` is set, treat it as an existing store; else show a store type select pre-selected with `suggestedType`. On 503 show "Pencarian toko belum tersedia".
  - `product-select.tsx` (from `listProducts()`, preselect `?product=`).
  - `price-input.tsx` (digits only, shows "Rp" prefix and thousand separators, stores an integer).
  - `quantity-input.tsx` (number + unit select from "Unit price rules"). The conversion table and `toDefaultUnitQuantity(value, inputUnit, defaultUnit)` live in `lib/units.ts` with tests in `tests/units.test.ts`.
  - Live preview: "Harga per kg: Rp14.400".
  - Promo tab: promo price or discount percent (radio), conditions (textarea, 200 chars), valid from/to (`<input type="date">`, default today and today + 7).
  - Client validation with the same zod limits as the API; field errors from a 400/422 response shown next to the field (map `errors[].path`).
  - On success: a confirmation panel "Terima kasih! Laporanmu menunggu persetujuan admin." with buttons "Laporkan lagi" (reset form) and "Ke peta".
- Files: `app/report/page.tsx`, `components/report/*`, `lib/units.ts`, `tests/units.test.ts`, `messages/id.json`.
- Verify: full flow for an existing store and a new Places store; invalid inputs show inline errors; the report appears in `/admin`.

#### C10. Confirm price (votes)

Depends on: C9.

**C10.1 Vote endpoint**
- Do: `POST /votes` in `src/votes/`: zod requires exactly one of `priceReportId` or `promoId`; the item must be `APPROVED` (and active for promos) else 404; voting on your own item → 403; duplicate → 409 (catch Prisma `P2002`). In one transaction: create `Vote`; for price reports increment `confirmationCount` and set `verifiedAt = now`; create a `VOTE_CAST` activity. Return `{ confirmationCount, verifiedAt }`.
- Files: `backend/src/votes/*`, `backend/src/app.module.ts`.
- Verify: unit tests for 201/403/404/409; e2e vote flow.

**C10.2 Vote button**
- Do: `components/vote-button.tsx` (client): label "Harga masih sama" plus the count; signed-out click → `/login?next=<current path>`; optimistic increment, rollback and a small error text on failure; after success or 409 show "Terkonfirmasi" and disable; 403 shows "Tidak bisa mengonfirmasi laporanmu sendiri". Put it in the store page price table cell and promo cards, and in the map info window.
- Files: `components/vote-button.tsx`, store page components, `components/map/store-info-window.tsx`.
- Verify: count increments once, the freshness badge becomes "Baru diverifikasi" after `router.refresh()`.

#### C11. Anti-abuse

Depends on: C9, C10.

**C11.1 Rate limits**
- Do: `npm install @nestjs/throttler@^6`. Register `ThrottlerModule` with named throttlers and apply with `@Throttle`: `POST /auth/login` and `/auth/register` 5 per 60s per IP; `POST /price-reports` and `/promos` 20 per hour per user id (custom `getTracker` using `req.user.id`, falling back to IP); `POST /votes` 60 per hour per user; `/places/*` 30 per 60s per user. Remove the hand-written limiter from `AuthService`.
- Files: `backend/src/app.module.ts`, `backend/src/common/user-throttler.guard.ts`, controllers, `backend/src/auth/auth.service.ts`.
- Verify: e2e test: the sixth login attempt within a minute returns 429.

**C11.2 Outlier flags**
- Do: migration `price_report_flags` (see "Domain model"). On `POST /price-reports`, compute the median `normalizedUnitPrice` of approved reports for the same product in the same city with `verifiedAt` in the last 30 days; if there are at least 3 and the new value is < 0.5× or > 2× the median, set `flagged = true` and `flagReason = "Unit price Rp<value> vs median Rp<median>"`. `GET /admin/pending` returns flagged items first.
- Files: `backend/prisma/schema.prisma`, `backend/prisma/migrations/*`, `backend/src/price-reports/*`, `backend/src/admin/*`.
- Verify: unit tests for the median rule (fewer than 3 reports → never flagged).

**C11.3 Admin page upgrade**
- Do: show per item: store (link), product, unit price and pack price with quantity (or promo details), submitter, submitted time, a red "Mencurigakan" badge with the reason when flagged; a toggle "Hanya yang mencurigakan"; approve/reject buttons disabled while the request runs.
- Files: `frontend/app/admin/page.tsx`, `frontend/components/admin/*`.
- Verify: an outlier report shows the badge first in the list.

#### C12. Static pages, SEO, and polish

Depends on: C7.

**C12.1 Static pages**
- Do: `/about` (what HematDekat is, how prices are reported, moderated, and confirmed), `/privacy` (what we store: email, name, reports, votes; cookies: one auth cookie; Google sign-in), `/terms` (prices are user-reported and may be wrong; no affiliation with stores or Google), `/feedback` (a `mailto:` link to the contact email from "Open questions"; no database form). All text original, in `messages/id.json`.
- Files: `app/about/page.tsx`, `app/privacy/page.tsx`, `app/terms/page.tsx`, `app/feedback/page.tsx`, `messages/id.json`.
- Verify: footer links work.

**C12.2 SEO files**
- Do: `app/sitemap.ts` (static pages + cities + products + stores; wrap backend calls in `try/catch` and return only static URLs on failure so the build never fails), `app/robots.ts` (allow all, disallow `/admin`, `/report`, `/login`, `/register`, link the sitemap), `app/manifest.ts` (name HematDekat, theme `#020617`), `app/icon.svg` and `app/apple-icon.png` (original simple logo), `app/opengraph-image.tsx` (1200×630, app name and tagline), JSON-LD `GroceryStore` on the store page (name, address, geo). Add `NEXT_PUBLIC_SITE_URL` to `frontend/.env.example` and use it for absolute URLs. Delete the template SVGs in `public/` (ask the user first).
- Files: `app/*.ts(x)`, `app/stores/[slug]/page.tsx`, `.env.example`, `public/*`.
- Verify: `npm run build` with the backend stopped; `/sitemap.xml` lists real URLs with the backend running.

**C12.3 States and accessibility**
- Do: `loading.tsx`, `error.tsx` (client, uses `ErrorState` with `reset`), and `not-found.tsx` at the root and for `stores/[slug]`, `cities/[slug]`, `products/[slug]`. Accessibility: every input has a label; pins are focusable (`AdvancedMarker` content is a `<button>` with an `aria-label` "<store>, Rp14.700/kg"); `aria-live="polite"` on the result count ("12 toko"); skip link "Langsung ke konten" in the layout.
- Files: `app/**`, `components/**`.
- Verify: keyboard-only walk-through of home → store → report; Lighthouse accessibility and SEO ≥ 90 on `/` and one store page.

#### C13. Tests, build, deployment notes (MVP checkpoint)

Depends on: C2 to C12.

- **C13.1** Frontend tests: review coverage of `lib/format.ts`, `lib/search-params.ts`, `lib/units.ts`, and repository parsing; add missing edge cases. `npm run test` passes.
- **C13.2** Backend e2e coverage: register/login, report submit, admin approve, vote, visibility rules, throttling. `npm run test:e2e` passes.
- **C13.3** `npm run build` in both apps; manual run of every item in "Verification".
- **C13.4** Deployment notes in `README.md`: Next.js on Vercel; NestJS on Railway, Render, or Fly.io; Postgres on Neon, Supabase, or Railway; frontend and backend on subdomains of one registrable domain (for example `hematdekat.id` and `api.hematdekat.id`) so the `SameSite=Lax` cookie works; set `Secure` cookies and `CORS_ORIGIN`; environment variables per service; Google Cloud key restrictions; a note that a 30-day coordinate refresh job and migrating `prisma/import-places.ts` to Places API (New) are follow-ups.
- **C13.5** Checkpoint: the user reviews the app and approves the MVP. Do not tick until the user says so.

### Phase D: Post-MVP (only after the user approves C13.5)

#### D1. Contributor points

- Do: migration `point_events`: `PointEvent { id String @id @default(cuid()), userId String, type PointEventType, points Int, sourceId String, createdAt DateTime @default(now()) }` with `@@unique([type, sourceId])` and `@@index([userId, createdAt])`; enum `PointEventType { PRICE_REPORT_APPROVED, PROMO_APPROVED, REPORT_CONFIRMED, VOTE_GIVEN, REVOKED }`. Rules: price report approved +10; promo approved +5; your report confirmed by another user +1 (max 20 per report; `sourceId` = vote id); casting a vote on someone else's item +1 (max 20 per day; `sourceId` = vote id); nothing on submit; if an approved item is later rejected, add a `REVOKED` event with the negative total for that item. Award inside the existing admin and vote transactions. `CurrentUser` gains `points` (sum).
- Verify: unit tests for each rule and cap.

#### D2. Leaderboard

- Do: `GET /leaderboard?period=week|month|all&city=<slug>` → `{ items: { rank, userId, displayName, points }[] }` (top 50; `displayName` = name or "Kontributor #<last 4 of id>", never email). `/leaderboard` page with period tabs (in the URL) and a city select; header link "Peringkat".
- Verify: e2e test for ordering and the email never appearing.

#### D3. Saved stores

- Do: migration `saved_stores`: `SavedStore { userId String, storeId String, createdAt DateTime @default(now()) }` with `@@id([userId, storeId])`. Endpoints `GET /me/saved-stores` (`StoreSummary[]`), `PUT /me/saved-stores/:storeSlug` (204), `DELETE /me/saved-stores/:storeSlug` (204). `components/save-store-button.tsx` (heart icon, optimistic, login redirect when signed out) on cards and the store page.
- Verify: save, reload, still saved; unsave.

#### D4. Profile page

- Do: `GET /me/profile` → `{ user: CurrentUser, rank: number | null, badges: { key, earnedAt }[], savedStores: StoreSummary[], reports: { id, kind, store, product, status, createdAt }[] }` (last 50 reports). Badges are derived: `first-report` (1 approved report), `price-hunter` (10 approved reports), `price-guardian` (50 votes given), `market-expert` (10 approved reports at `market` stores). `/profile` page (inside `RequireUser`) with sections for points and rank, badges, saved stores, and "Laporan saya" with status badges; link in the user menu.
- Verify: a new user sees zero states; after an approval the report shows "Disetujui" and points increase.

## Verification

1. `npm run lint`, `npm run typecheck` (frontend), `npm run test`, `npm run build` pass in both apps; `npm run test:e2e` passes in `backend/`.
2. `npm run build` in `frontend/` passes with the backend stopped.
3. Map: pins cluster, stay in sync with the list, and show the selected product's unit price; product, search, type, max price, promo, freshness, sort, location, and "Cari di area ini" update the URL, list, and pins together; reload restores the view.
4. Mobile (375px wide): map/list toggle, filter bottom sheet, header menu, report form all usable.
5. Flow: register, sign in with email and with Google, submit a price for a new Places store, approve it as admin, see it on the map, confirm it as another user, see "Baru diverifikasi".
6. Stopping the backend shows error states, never mock data.
7. `git grep AIza` returns nothing; the browser key only works from allowed referrers; no response from the backend contains the Places server key.

## Scope

- Included: Phase C (MVP) and, after approval, Phase D.
- Excluded: activity feed UI, comments, community pages or forums, native apps, payments, password reset by email, moderator role, online ordering or delivery, price history charts, English locale, coordinate refresh job (documented as a follow-up).
- Cost: Google Maps and Places are billable beyond the free quota.
- Data quality: freshness, moderation, and outlier flags are core features.

## Decided

- `.gitignore` stays as it is. `plan.md` and `AGENTS.md` are not committed.
- `/feedback` is a `mailto:` link, not a form.

## Open questions

Ask the user before the sub-step listed.

1. Store names: Google's terms prefer fetching Places content fresh. Recommended: treat `Store.name` like coordinates (a cache, refreshed within 30 days by the follow-up job). Needed by C9.1.


## Status

Tick a sub-step only when all its "Verify" checks pass. Agents: read "How to use this file" first.

### Phase A and B (first pass)

- [x] Steps 1–13 done as a first pass (gaps in "Current state audit")

### Phase C: MVP

- [x] C1. Docs and environment hygiene
- C2. Frontend foundation (earlier work: `app-header.tsx`, `product-selector.tsx`, `store-card.tsx`, `store-map.tsx` extracted from `app/page.tsx`)
  - [x] C2.1 Install dependencies and i18n
  - [x] C2.2 Move all UI strings into `messages/id.json`
  - [x] C2.3 Format helpers
  - [x] C2.4 Shared layout
  - [x] C2.5 API client and current user
  - [x] C2.6 Base UI components
- C3. Backend correctness fixes
  - [x] C3.1 Auth hardening
  - [x] C3.2 Roles guard and admin endpoints
  - [x] C3.3 Feature modules
  - [x] C3.4 DTOs and public visibility
  - [x] C3.5 Seed fixes
  - [x] C3.6 Places API (New) proxy
  - [x] C3.7 Test database and e2e baseline
- C4. Repository rewrite
  - [x] C4.1 Types
  - [x] C4.2 Repository functions
  - [x] C4.3 Tests and fixtures
  - [x] C4.4 Pages use the new repository
- C5. Home layout and map
  - [x] C5.1 Layout shell
  - [x] C5.2 Product selection and cards
  - [x] C5.3 Map, pins, clustering, sync
- C6. Search, filters, sort, geolocation
  - [x] C6.1 URL state helpers
  - [x] C6.2 Toolbar and filter panel
  - [x] C6.3 Search this area
  - [x] C6.4 Backend filters and sorting
- C7. Store, city, and product pages
  - [x] C7.1 Store page
  - [x] C7.2 City pages
  - [x] C7.3 Product page
- C8. Auth completion
  - [x] C8.1 Register endpoint
  - [x] C8.2 Login and register pages
  - [x] C8.3 Protected pages
- C9. Report a price or promo
  - [x] C9.1 Price report endpoint
  - [x] C9.2 Promo endpoint
  - [x] C9.3 Report page
- C10. Confirm price
  - [x] C10.1 Vote endpoint
  - [x] C10.2 Vote button
- C11. Anti-abuse
  - [x] C11.1 Rate limits
  - [x] C11.2 Outlier flags
  - [x] C11.3 Admin page upgrade
- C12. Static pages, SEO, polish
  - [x] C12.1 Static pages
  - [ ] C12.2 SEO files
  - [ ] C12.3 States and accessibility
- C13. Tests, build, deployment (MVP checkpoint)
  - [ ] C13.1 Frontend tests
  - [ ] C13.2 Backend e2e coverage
  - [ ] C13.3 Builds and manual verification
  - [ ] C13.4 Deployment notes
  - [ ] C13.5 User approval

### Phase D: Post-MVP (needs user approval)

- [ ] D1. Contributor points
- [ ] D2. Leaderboard
- [ ] D3. Saved stores
- [ ] D4. Profile page
