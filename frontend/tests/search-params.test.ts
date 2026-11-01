import assert from "node:assert/strict";
import test from "node:test";

import { buildSearchParams, parseSearchParams } from "../lib/search-params";

test("parseSearchParams accepts valid store filter values and keeps defaults for missing values", () => {
  const params = parseSearchParams({
    product: "beras-premium",
    q: "Kramat",
    city: "jakarta",
    type: "supermarket,minimarket",
    maxPrice: "250000",
    promo: "1",
    fresh: "14",
    sort: "nearest",
    lat: "-6.2",
    lng: "106.8",
    bbox: "-6.5,106.7,-6.1,106.9",
  });

  assert.deepEqual(params, {
    product: "beras-premium",
    q: "Kramat",
    city: "jakarta",
    type: ["supermarket", "minimarket"],
    maxPrice: 250000,
    promo: true,
    fresh: 14,
    sort: "nearest",
    lat: -6.2,
    lng: 106.8,
    bbox: [-6.5, 106.7, -6.1, 106.9],
  });
});

test("parseSearchParams drops invalid values but keeps valid ones and applies defaults", () => {
  const params = parseSearchParams({
    product: "bad product",
    q: "",
    city: "b@d",
    type: "invalid,supermarket",
    maxPrice: "abc",
    promo: "0",
    fresh: "7",
    sort: "oldest",
    lat: "99",
    lng: "40",
    bbox: "-7,90,not-a-number,110",
  });

  assert.deepEqual(params, {
    product: "beras-premium",
    q: undefined,
    city: undefined,
    type: ["supermarket"],
    maxPrice: undefined,
    promo: false,
    fresh: undefined,
    sort: "cheapest",
    lat: undefined,
    lng: undefined,
    bbox: undefined,
  });
});

test("buildSearchParams omits defaults and sorts keys alphabetically", () => {
  const query = buildSearchParams({
    product: "beras-premium",
    q: "Kramat",
    city: "jakarta",
    type: ["supermarket", "minimarket"],
    maxPrice: 250000,
    promo: true,
    fresh: 14,
    sort: "nearest",
    lat: -6.2,
    lng: 106.8,
    bbox: [-6.5, 106.7, -6.1, 106.9],
  });

  assert.equal(
    query,
    "bbox=-6.5%2C106.7%2C-6.1%2C106.9&city=jakarta&fresh=14&lat=-6.2&lng=106.8&maxPrice=250000&promo=1&q=Kramat&sort=nearest&type=supermarket%2Cminimarket",
  );
});

test("buildSearchParams omits default values and empty filters", () => {
  assert.equal(
    buildSearchParams({
      product: "beras-premium",
      sort: "cheapest",
      promo: false,
      type: [],
      q: "",
      city: undefined,
      fresh: undefined,
      maxPrice: undefined,
      lat: undefined,
      lng: undefined,
      bbox: undefined,
    }),
    "",
  );
});
