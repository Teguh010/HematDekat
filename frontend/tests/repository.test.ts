import assert from "node:assert/strict";
import test from "node:test";

import { getStores, getTopCheapestStores } from "../lib/data/repository";

test("repository exposes usable mock store data", () => {
  const stores = getStores();

  assert.ok(stores.length > 0, "stores should not be empty");
  assert.ok(stores.every((store) => store.products.length > 0), "each store should contain prices");
});

test("cheapest rice list returns the lowest price first", () => {
  const stores = getTopCheapestStores("Beras premium");

  assert.ok(stores.length > 0, "expected at least one store for the selected product");
  assert.ok(stores[0].product, "top result should include a product");
  assert.ok(stores[0].product?.normalizedUnitPrice > 0, "normalized price should be positive");
});
