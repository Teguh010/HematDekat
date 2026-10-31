import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";

import { ApiError, apiFetch } from "../lib/api-client";
import { getCity, listStores } from "../lib/data/repository";
import { storesPageFixture, storeSummaryFixture } from "./fixtures/stores";

test("listStores parses a valid paginated response", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () =>
    new Response(JSON.stringify(storesPageFixture), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  try {
    const page = await listStores({ limit: 20 });
    assert.equal(page.items.length, 1);
    assert.equal(page.items[0]?.name, "Toko Anyar");
    assert.equal(page.items[0]?.price?.normalizedUnitPrice, 14000);
  } finally {
    global.fetch = originalFetch;
  }
});

test("invalid repository payloads reject with ApiError/zod validation", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () =>
    new Response(JSON.stringify({ items: "not-an-array" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  try {
    await assert.rejects(() => listStores(), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      return true;
    });
  } finally {
    global.fetch = originalFetch;
  }
});

test("missing records surface a 404 ApiError", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () =>
    new Response(JSON.stringify({ message: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });

  try {
    await assert.rejects(() => getCity("missing"), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 404);
      return true;
    });
  } finally {
    global.fetch = originalFetch;
  }
});

test("network failure throws ApiError without mock fallback", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error("offline");
  };

  try {
    await assert.rejects(() => apiFetch("/cities", { schema: z.array(z.object({ name: z.string() })) }), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.message, "offline");
      return true;
    });
  } finally {
    global.fetch = originalFetch;
  }
});

export { storeSummaryFixture };
