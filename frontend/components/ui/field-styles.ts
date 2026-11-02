// Single source of truth for form control styling (input, select, textarea).
// Change the look of every field here.

const base =
  "rounded-lg border bg-surface text-sm text-ink-900 placeholder:text-ink-400 focus-visible:border-brand-500 focus-ring";

const sizes = {
  sm: "h-8 px-2",
  md: "h-9 px-3",
  area: "min-h-20 px-3 py-2",
} as const;

export type FieldSize = keyof typeof sizes;

export function fieldClass(options: { error?: boolean; size?: FieldSize; width?: "full" | "auto" } = {}): string {
  const { error = false, size = "md", width = "full" } = options;
  return `${base} ${sizes[size]} ${width === "full" ? "w-full" : ""} ${error ? "border-danger-300 bg-danger-50" : "border-ink-300"}`;
}
