"use client";

import { Icon } from "@iconify/react";

import type { Product } from "@/lib/data/types";
import { iconForProduct, toneForProduct } from "@/lib/product-tones";

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
              className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors focus-ring ${
                product.slug === value ? tone.active : tone.idle
              }`}
            >
              <Icon icon={iconForProduct(product.slug)} className="h-4 w-4 shrink-0" aria-hidden />
              {product.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

