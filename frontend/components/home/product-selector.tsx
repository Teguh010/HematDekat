"use client";

import type { Product } from "@/lib/data/types";

type ProductSelectorProps = {
  products: Product[];
  value: string;
  onChange: (nextSlug: string) => void;
};

export function ProductSelector({ products, value, onChange }: ProductSelectorProps) {
  return (
    <div className="max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max gap-2">
        {products.map((product) => (
          <button
            key={product.slug}
            type="button"
            aria-pressed={product.slug === value}
            onClick={() => onChange(product.slug)}
            className={`h-8 shrink-0 rounded-full border px-3 text-sm transition-colors focus-ring ${
              product.slug === value
                ? "border-brand-500 bg-brand-50 text-brand-800"
                : "border-ink-200 bg-surface text-ink-700 hover:bg-ink-50"
            }`}
          >
            {product.name}
          </button>
        ))}
      </div>
    </div>
  );
}
