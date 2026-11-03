import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";

import { ApiError, apiFetch } from "../lib/api-client";
import { getCity, getLeaderboard, listSavedStores, listStores, saveStore, unsaveStore } from "../lib/data/repository";
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
      assert.match(error.message, /Unexpected response shape from \/stores/);
      assert.match(error.message, /items/);
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

test("getLeaderboard parses a ranked list and never requests an email field", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";
  global.fetch = async (input: RequestInfo | URL) => {
    requestedUrl = String(input);
    return new Response(
      JSON.stringify({
        items: [
          { rank: 1, userId: "user-1", displayName: "Dewi", points: 25 },
          { rank: 2, userId: "user-2", displayName: "Kontributor #er-2", points: 11 },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    const items = await getLeaderboard({ period: "week", city: "jakarta" });
    assert.equal(items.length, 2);
    assert.equal(items[0]?.displayName, "Dewi");
    assert.equal(items[1]?.points, 11);
    assert.ok(requestedUrl.includes("/leaderboard?"));
    assert.ok(requestedUrl.includes("period=week"));
    assert.ok(requestedUrl.includes("city=jakarta"));
    assert.ok(!JSON.stringify(items).includes("email"));
  } finally {
    global.fetch = originalFetch;
  }
});

test("listSavedStores parses a StoreSummary array", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () =>
    new Response(JSON.stringify([storeSummaryFixture]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  try {
    const stores = await listSavedStores();
    assert.equal(stores.length, 1);
    assert.equal(stores[0]?.slug, storeSummaryFixture.slug);
  } finally {
    global.fetch = originalFetch;
  }
});

test("saveStore and unsaveStore PUT/DELETE and resolve on a 204 response", async () => {
  const originalFetch = global.fetch;
  const calls: Array<{ url: string; method: string | undefined }> = [];
  global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), method: init?.method });
    return new Response(null, { status: 204 });
  };

  try {
    await saveStore("toko-anyar");
    await unsaveStore("toko-anyar");
    assert.equal(calls.length, 2);
    assert.equal(calls[0]?.method, "PUT");
    assert.ok(calls[0]?.url.includes("/me/saved-stores/toko-anyar"));
    assert.equal(calls[1]?.method, "DELETE");
  } finally {
    global.fetch = originalFetch;
  }
});

export { storeSummaryFixture };
