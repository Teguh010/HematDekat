"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";

import { fieldClass } from "@/components/ui/field-styles";
import { formatRupiah } from "@/lib/format";

type PriceInputProps = {
  value: string;
  onChange: (nextValue: string) => void;
  error?: string;
};

export function PriceInput({ value, onChange, error }: PriceInputProps) {
  const t = useTranslations("report");
  const inputId = useId();
  const digits = value.replace(/\D/g, "");
  const displayValue = digits ? formatRupiah(Number(digits)) : "";

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-xs font-medium text-ink-700">{t("price")}</label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-ink-500">{t("currencySymbol")}</span>
        <input
          id={inputId}
          inputMode="numeric"
          value={displayValue}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
          aria-invalid={Boolean(error)}
          className={`${fieldClass({ error: Boolean(error) })} pl-10`}
          placeholder={t("priceExample")}
        />
      </div>
      {error ? <p className="text-xs text-danger-700">{error}</p> : null}
    </div>
  );
}
