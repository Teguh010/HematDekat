import type { Store } from "@/lib/data/repository";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

type StoreCardProps = {
  store: Store;
};

export function StoreCard({ store }: StoreCardProps) {
  const lowestProduct = store.products.length > 0 ? [...store.products].sort((a, b) => a.price - b.price)[0] : null;

  return (
    <article key={store.id} className="rounded-2xl border border-white/10 bg-slate-800 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">{store.name}</h3>
          <p className="mt-1 text-sm text-slate-400">
            {store.district}, {store.city}
          </p>
        </div>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-emerald-300">
          {store.type}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-slate-300">
        <span>⭐ {store.rating}</span>
        <span>{store.distanceKm} km</span>
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/80 p-2">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Harga paling murah</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-medium text-slate-200">{lowestProduct?.name ?? "-"}</span>
          <span className="text-base font-bold text-emerald-300">
            {lowestProduct ? formatCurrency(lowestProduct.price) : "-"}
          </span>
        </div>
      </div>
    </article>
  );
}
