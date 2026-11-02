"use client";

import type { Product } from "@/lib/data/types";
import { toneForProduct } from "@/lib/product-tones";

type ProductSelectorProps = {
  products: Product[];
  value: string;
  onChange: (nextSlug: string) => void;
};

export function ProductSelector({ products, value, onChange }: ProductSelectorProps) {
  return (
    <div className="max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max gap-2">
        {products.map((product) => {
          const tone = toneForProduct(product.slug);
          return (
            <button
              key={product.slug}
              type="button"
              aria-pressed={product.slug === value}
              onClick={() => onChange(product.slug)}
              className={`h-8 shrink-0 rounded-full border px-3 text-sm font-medium transition-colors focus-ring ${
                product.slug === value ? tone.active : tone.idle
              }`}
            >
              {product.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
