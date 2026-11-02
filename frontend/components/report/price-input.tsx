"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";

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
      <label htmlFor={inputId} className="block text-xs font-medium text-slate-700">{t("price")}</label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-500">{t("currencySymbol")}</span>
        <input
          id={inputId}
          inputMode="numeric"
          value={displayValue}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
          aria-invalid={Boolean(error)}
          className={`h-9 w-full rounded-lg border bg-white px-3 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
            error ? "border-red-300 bg-red-50" : "border-slate-300"
          }`}
          placeholder={t("priceExample")}
        />
      </div>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
