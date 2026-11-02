"use client";

import { useTranslations } from "next-intl";

import { formatRupiah } from "@/lib/format";

type PriceInputProps = {
  value: string;
  onChange: (nextValue: string) => void;
  error?: string;
};

export function PriceInput({ value, onChange, error }: PriceInputProps) {
  const t = useTranslations("report");
  const digits = value.replace(/\D/g, "");
  const displayValue = digits ? formatRupiah(Number(digits)) : "";

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-200">{t("price")}</label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">{t("currencySymbol")}</span>
        <input
          inputMode="numeric"
          value={displayValue}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-xl border bg-slate-800 px-3 py-2.5 pl-10 text-sm text-white placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${
            error ? "border-red-500/30 bg-red-500/5" : "border-white/10"
          }`}
          placeholder={t("priceExample")}
        />
      </div>
      {error ? <p className="text-sm text-red-200">{error}</p> : null}
    </div>
  );
}
