import type { ProductUnit } from "@/lib/data/types";

const unitShare: Record<ProductUnit, number> = {
  kg: 1,
  liter: 1,
  pcs: 1,
  pack: 10,
  tray: 30,
};

export function toDefaultUnitQuantity(value: number, inputUnit: ProductUnit, defaultUnit: ProductUnit): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  if (inputUnit === defaultUnit) {
    return Number(value.toFixed(3));
  }

  const normalized = value * unitShare[inputUnit];
  return Number((normalized / unitShare[defaultUnit]).toFixed(3));
}
