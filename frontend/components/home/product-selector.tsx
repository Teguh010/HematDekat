"use client";

import type { Product } from "@/lib/data/types";

type ProductSelectorProps = {
  products: Product[];
  value: string;
  onChange: (nextSlug: string) => void;
};

export function ProductSelector({ products, value, onChange }: ProductSelectorProps) {
  return (
    <div className="flex min-w-max gap-2 overflow-x-auto pb-1">
      {products.map((product) => (
        <button
          key={product.slug}
          type="button"
          aria-pressed={product.slug === value}
          onClick={() => onChange(product.slug)}
          className={`rounded-full border px-3 py-1.5 text-sm transition ${
            product.slug === value
              ? "border-emerald-400 bg-emerald-500/15 text-emerald-200"
              : "border-white/10 bg-slate-800 text-slate-300 hover:border-slate-500"
          }`}
        >
          {product.name}
        </button>
      ))}
    </div>
  );
}
