"use client";

import { useId } from "react";
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
  const inputId = useId();

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-xs font-medium text-slate-700">{t("quantity")}</label>
      <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
        <input
          id={inputId}
          type="number"
          min="0"
          step="0.001"
          inputMode="decimal"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          aria-invalid={Boolean(error)}
          className={`h-9 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
            error ? "border-red-300 bg-red-50" : "border-slate-300"
          }`}
          placeholder={t("quantityPlaceholder")}
        />
        <select
          aria-label={t("quantity")}
          value={unit}
          onChange={(event) => onUnitChange(event.target.value as ProductUnit)}
          className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:border-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          {units.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
