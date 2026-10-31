import assert from "node:assert/strict";
import test from "node:test";

import { daysSince, formatRupiah, formatUnitPrice, freshnessLevel } from "../lib/format";

test("formatRupiah removes the non-breaking space and keeps IDR format", () => {
  assert.equal(formatRupiah(14700), "Rp14.700");
});

test("formatUnitPrice appends the unit label", () => {
  assert.equal(formatUnitPrice(14700, "kg"), "Rp14.700/kg");
});

test("daysSince floors to whole days and never goes negative", () => {
  const now = new Date("2026-10-31T12:00:00Z");
  assert.equal(daysSince("2026-10-29T00:00:00Z", now), 2);
  assert.equal(daysSince("2026-11-01T00:00:00Z", now), 0);
});

test("freshnessLevel classifies recentness correctly", () => {
  const now = new Date("2026-10-31T12:00:00Z");
  assert.equal(freshnessLevel("2026-10-30T10:00:00Z", now), "fresh");
  assert.equal(freshnessLevel("2026-10-20T12:00:00Z", now), "recent");
  assert.equal(freshnessLevel("2026-09-10T12:00:00Z", now), "stale");
});
