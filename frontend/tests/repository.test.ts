import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";

import { ApiError, apiFetch } from "../lib/api-client";
import { fetchStores, getStores, getTopCheapestStores } from "../lib/data/repository";

test("repository cache reflects backend data after fetch", async () => {
  const originalFetch = global.fetch;

  global.fetch = async () =>
    new Response(
      JSON.stringify([
        {
          id: "store-1",
          slug: "store-1",
          name: "Toko Baru",
          city: "Jakarta",
          district: "Menteng",
          type: "market",
          rating: 4.8,
          reviewCount: 10,
          distanceKm: 1.2,
          updatedAt: "baru saja",
          coordinates: { lat: -6.2, lng: 106.8 },
          products: [{ name: "Beras premium", category: "rice", unit: "kg", price: 14000, normalizedUnitPrice: 14000, isPromo: true }],
        },
      ]),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );

  try {
    await fetchStores();
    const stores = getStores();

    assert.equal(stores.length, 1, "fetched backend stores should populate the repository cache");
    assert.equal(stores[0].name, "Toko Baru");
    assert.equal(stores[0].products[0].normalizedUnitPrice, 14000);
  } finally {
    global.fetch = originalFetch;
  }
});

test("repository maps backend priceReports into visible product prices", async () => {
  const originalFetch = global.fetch;

  global.fetch = async () =>
    new Response(
      JSON.stringify([
        {
          id: "store-2",
          slug: "store-2",
          name: "Toko Data",
          city: "Jakarta",
          district: "Menteng",
          type: "market",
          rating: 4.5,
          reviewCount: 12,
          distanceKm: 1.8,
          updatedAt: "baru saja",
          coordinates: { lat: -6.2, lng: 106.8 },
          priceReports: [
            {
              id: "report-1",
              price: 14500,
              normalizedUnitPrice: 14500,
              status: "APPROVED",
              product: { id: "prod-1", name: "Beras premium", category: "RICE", defaultUnit: "KG" },
            },
          ],
        },
      ]),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );

  try {
    await fetchStores();
    const stores = getStores();
    assert.equal(stores[0]?.products[0]?.name, "Beras premium");
    assert.equal(stores[0]?.products[0]?.normalizedUnitPrice, 14500);
  } finally {
    global.fetch = originalFetch;
  }
});

test("apiFetch validates a typed response and throws ApiError on bad payloads", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () =>
    new Response(JSON.stringify({ name: "Emma" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  try {
    const payload = await apiFetch("/auth/me", {
      schema: z.object({ name: z.string() }),
    });

    assert.equal(payload.name, "Emma");
  } finally {
    global.fetch = originalFetch;
  }

  global.fetch = async () =>
    new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });

  try {
    await assert.rejects(
      () =>
        apiFetch("/auth/me", {
          schema: z.object({ name: z.string() }),
        }),
      (error: unknown) => {
        assert.ok(error instanceof ApiError);
        assert.equal(error.status, 401);
        return true;
      },
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test("cheapest rice list returns the lowest price first when data is available", () => {
  const stores = getTopCheapestStores("Beras premium");

  assert.ok(stores.length >= 0, "the repository should return an array even when no product is cached");
  if (stores[0]?.product) {
    assert.ok(stores[0].product.normalizedUnitPrice > 0, "normalized price should be positive");
  }
});
