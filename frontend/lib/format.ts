const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const DAY_MS = 86_400_000;

export type FreshnessLevel = "fresh" | "recent" | "stale";

export function formatRupiah(value: number): string {
  return rupiahFormatter.format(value).replace(/\s/g, "");
}

export function formatUnitPrice(value: number, unitLabel: string): string {
  return `${formatRupiah(value)}/${unitLabel}`;
}

export function daysSince(iso: string, now: Date = new Date()): number {
  const diff = now.getTime() - new Date(iso).getTime();
  return Math.max(0, Math.floor(diff / DAY_MS));
}

export function freshnessLevel(iso: string, now: Date = new Date()): FreshnessLevel {
  const days = daysSince(iso, now);

  if (days <= 3) {
    return "fresh";
  }

  if (days <= 14) {
    return "recent";
  }

  return "stale";
}
