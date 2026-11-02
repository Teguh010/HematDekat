import assert from "node:assert/strict";
import test from "node:test";

import { toneForProduct } from "../lib/product-tones";

const seededSlugs = [
  "beras-premium",
  "minyak-goreng-curah",
  "gula-pasir",
  "telur-ayam",
  "tepung-terigu",
  "garam",
  "mie-instan",
  "cabai-merah",
  "bawang-merah",
  "bawang-putih",
  "ayam-broiler",
  "daging-sapi",
  "ikan-bandeng",
];

test("each seeded product has a pastel chip tone and a pin dot", () => {
  const dots = new Set<string>();

  for (const slug of seededSlugs) {
    const tone = toneForProduct(slug);
    assert.match(tone.idle, /bg-/);
    assert.match(tone.active, /bg-/);
    assert.match(tone.dot, /^bg-/);
    dots.add(tone.dot);
  }

  assert.ok(dots.size >= 5, "staple chips should not all share one color");
});

test("an unknown product falls back to a neutral tone", () => {
  assert.equal(toneForProduct("tidak-ada").dot, toneForProduct(null).dot);
  assert.match(toneForProduct(undefined).idle, /bg-surface/);
});
