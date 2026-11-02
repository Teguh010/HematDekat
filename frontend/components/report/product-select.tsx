"use client";

import { useTranslations } from "next-intl";

import { Chip } from "@/components/ui/chip";
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
      <p id="report-product-label" className="text-xs font-medium text-ink-700">{t("product")}</p>
      <div role="group" aria-labelledby="report-product-label" className="flex flex-wrap gap-2">
        {products.map((product) => (
          <Chip key={product.slug} active={product.slug === value} onClick={() => onChange(product.slug)}>
            {product.name}
          </Chip>
        ))}
      </div>
      {error ? <p className="text-xs text-danger-700">{error}</p> : null}
    </div>
  );
}
