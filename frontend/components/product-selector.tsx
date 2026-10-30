type ProductSelectorProps = {
  items: string[];
  value: string;
  onChange: (nextValue: string) => void;
};

export function ProductSelector({ items, value, onChange }: ProductSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((product) => (
        <button
          key={product}
          type="button"
          aria-pressed={product === value}
          onClick={() => onChange(product)}
          className={`rounded-full border px-3 py-1.5 text-sm transition ${
            product === value
              ? "border-emerald-400 bg-emerald-500/15 text-emerald-200"
              : "border-white/10 bg-slate-800 text-slate-300 hover:border-slate-500"
          }`}
        >
          {product}
        </button>
      ))}
    </div>
  );
}
