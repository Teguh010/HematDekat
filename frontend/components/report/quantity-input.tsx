"use client";

import { useTranslations } from "next-intl";

import type { ProductUnit } from "@/lib/data/types";

type QuantityInputProps = {
  value: string;
  unit: ProductUnit;
  onValueChange: (nextValue: string) => void;
  onUnitChange: (nextUnit: ProductUnit) => void;
  error?: string;
};

const units: ProductUnit[] = ["kg", "liter", "pcs", "pack", "tray"];

export function QuantityInput({ value, unit, onValueChange, onUnitChange, error }: QuantityInputProps) {
  const t = useTranslations("report");

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-200">{t("quantity")}</label>
      <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
        <input
          type="number"
          min="0"
          step="0.001"
          inputMode="decimal"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-xl border bg-slate-800 px-3 py-2.5 text-sm text-white placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${
            error ? "border-red-500/30 bg-red-500/5" : "border-white/10"
          }`}
          placeholder={t("quantityPlaceholder")}
        />
        <select
          value={unit}
          onChange={(event) => onUnitChange(event.target.value as ProductUnit)}
          className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
        >
          {units.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      {error ? <p className="text-sm text-red-200">{error}</p> : null}
    </div>
  );
}
