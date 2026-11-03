import assert from "node:assert/strict";
import test from "node:test";

import { iconForProduct, toneForProduct } from "../lib/product-tones";

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

test("each seeded product has a distinct, attribution-free category icon", () => {
  const icons = new Set<string>();

  for (const slug of seededSlugs) {
    const icon = iconForProduct(slug);
    assert.match(icon, /^(iconito|fluent-emoji-flat):/);
    icons.add(icon);
  }

  assert.equal(icons.size, seededSlugs.length, "every staple should have its own icon");
});

test("an unknown product falls back to a generic icon", () => {
  assert.equal(iconForProduct("tidak-ada"), iconForProduct(null));
  assert.equal(iconForProduct(undefined), "mdi:basket-outline");
});
