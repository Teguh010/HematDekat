"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";

import { fieldClass } from "@/components/ui/field-styles";
import { Select } from "@/components/ui/select";
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
      <label htmlFor={inputId} className="block text-xs font-medium text-ink-700">{t("quantity")}</label>
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
          className={fieldClass({ error: Boolean(error) })}
          placeholder={t("quantityPlaceholder")}
        />
        <Select
          aria-label={t("quantity")}
          value={unit}
          onChange={(event) => onUnitChange(event.target.value as ProductUnit)}
        >
          {units.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </div>
      {error ? <p className="text-xs text-danger-700">{error}</p> : null}
    </div>
  );
}
