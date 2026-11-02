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
            className={`h-8 shrink-0 rounded-full border px-3 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
              product.slug === value
                ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {product.name}
          </button>
        ))}
      </div>
    </div>
  );
}
