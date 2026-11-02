"use client";

import { useTranslations } from "next-intl";

import type { Product } from "@/lib/data/types";

type ProductSelectProps = {
  products: Product[];
  value: string;
  onChange: (nextSlug: string) => void;
  error?: string;
};

export function ProductSelect({ products, value, onChange, error }: ProductSelectProps) {
  const t = useTranslations("report");

  return (
    <div className="space-y-1">
      <p id="report-product-label" className="text-xs font-medium text-slate-700">{t("product")}</p>
      <div role="group" aria-labelledby="report-product-label" className="flex flex-wrap gap-2">
        {products.map((product) => (
          <button
            key={product.slug}
            type="button"
            aria-pressed={product.slug === value}
            onClick={() => onChange(product.slug)}
            className={`inline-flex h-8 items-center rounded-full border px-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
              product.slug === value
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {product.name}
          </button>
        ))}
      </div>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
