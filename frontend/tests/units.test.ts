import assert from "node:assert/strict";
import test from "node:test";

import { toDefaultUnitQuantity } from "../lib/units";

test("keeps a value unchanged when the input unit already matches the default unit", () => {
  assert.equal(toDefaultUnitQuantity(2.5, "kg", "kg"), 2.5);
  assert.equal(toDefaultUnitQuantity(12, "pcs", "pcs"), 12);
});

test("converts grouped units into the default unit using the shared conversion table", () => {
  assert.equal(toDefaultUnitQuantity(2, "pack", "pcs"), 20);
  assert.equal(toDefaultUnitQuantity(3, "tray", "pcs"), 90);
});
