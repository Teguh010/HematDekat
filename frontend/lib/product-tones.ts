export type ProductTone = {
  idle: string;
  active: string;
  dot: string;
};

const butter: ProductTone = {
  idle: "border-warn-200 bg-warn-50 text-warn-800 hover:bg-warn-100",
  active: "border-warn-600 bg-warn-100 text-warn-800",
  dot: "bg-warn-600",
};

const peach: ProductTone = {
  idle: "border-peach-200 bg-peach-50 text-peach-800 hover:bg-peach-100",
  active: "border-peach-400 bg-peach-100 text-peach-800",
  dot: "bg-peach-400",
};

const blush: ProductTone = {
  idle: "border-blush-200 bg-blush-50 text-blush-800 hover:bg-blush-100",
  active: "border-blush-400 bg-blush-100 text-blush-800",
  dot: "bg-blush-400",
};

const mint: ProductTone = {
  idle: "border-good-200 bg-good-50 text-good-800 hover:bg-good-100",
  active: "border-good-600 bg-good-100 text-good-800",
  dot: "bg-good-600",
};

const lilac: ProductTone = {
  idle: "border-lilac-200 bg-lilac-50 text-lilac-800 hover:bg-lilac-100",
  active: "border-lilac-400 bg-lilac-100 text-lilac-800",
  dot: "bg-lilac-400",
};

const mist: ProductTone = {
  idle: "border-mist-200 bg-mist-50 text-mist-800 hover:bg-mist-100",
  active: "border-mist-400 bg-mist-100 text-mist-800",
  dot: "bg-mist-400",
};

const berry: ProductTone = {
  idle: "border-berry-200 bg-berry-50 text-berry-800 hover:bg-berry-100",
  active: "border-berry-400 bg-berry-100 text-berry-800",
  dot: "bg-berry-400",
};

const fallback: ProductTone = {
  idle: "border-ink-200 bg-surface text-ink-700 hover:bg-ink-50",
  active: "border-ink-400 bg-ink-100 text-ink-800",
  dot: "bg-ink-400",
};

const tonesBySlug: Record<string, ProductTone> = {
  "beras-premium": butter,
  "minyak-goreng-curah": peach,
  "gula-pasir": blush,
  "telur-ayam": mint,
  "tepung-terigu": lilac,
  garam: mist,
  "mie-instan": butter,
  "cabai-merah": berry,
  "bawang-merah": blush,
  "bawang-putih": lilac,
  "ayam-broiler": peach,
  "daging-sapi": berry,
  "ikan-bandeng": mist,
};

export function toneForProduct(slug: string | null | undefined): ProductTone {
  if (slug && tonesBySlug[slug]) {
    return tonesBySlug[slug];
  }
  return fallback;
}
