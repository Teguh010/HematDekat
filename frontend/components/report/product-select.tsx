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
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-200">{t("product")}</label>
      <div className="flex flex-wrap gap-2">
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
      {error ? <p className="text-sm text-red-200">{error}</p> : null}
    </div>
  );
}
