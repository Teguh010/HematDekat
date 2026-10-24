import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-400">Admin</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Moderasi harga</h1>
        </div>
        <Link href="/" className="rounded-full border border-white/10 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:border-emerald-400">
          Ke peta
        </Link>
      </div>

      <div className="space-y-4">
        {[
          { store: "Pasar Kramat Jati", product: "Beras premium", price: "Rp 14.500/kg", status: "Pending" },
          { store: "Toko Rahma", product: "Telur ayam", price: "Rp 2.750/pcs", status: "Pending" },
          { store: "Pasar Sukajadi", product: "Gula pasir", price: "Rp 14.200/kg", status: "Approved" },
        ].map((item) => (
          <div key={`${item.store}-${item.product}`} className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-slate-900 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-semibold text-white">{item.store}</p>
              <p className="text-sm text-slate-400">{item.product} • {item.price}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${item.status === "Approved" ? "bg-emerald-500/10 text-emerald-300" : "bg-yellow-500/10 text-yellow-300"}`}>
                {item.status}
              </span>
              <button type="button" className="rounded-full bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400">
                Approve
              </button>
              <button type="button" className="rounded-full border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:border-slate-500">
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
