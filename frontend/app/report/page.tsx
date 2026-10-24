import Link from "next/link";

export default function ReportPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-400">Laporan</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Laporkan harga atau promo</h1>
        </div>
        <Link href="/" className="rounded-full border border-white/10 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:border-emerald-400">
          Kembali ke peta
        </Link>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900 p-6">
        <form className="space-y-5">
          <div>
            <label className="mb-2 block text-sm text-slate-300">Nama toko</label>
            <input className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-emerald-400" placeholder="Contoh: Pasar Kramat Jati" />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Produk</label>
            <input className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-emerald-400" placeholder="Contoh: Beras premium" />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Harga</label>
              <input className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-emerald-400" placeholder="Rp 14.500" />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Satuan</label>
              <select className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-emerald-400">
                <option>kg</option>
                <option>liter</option>
                <option>pcs</option>
                <option>pack</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Catatan promo</label>
            <textarea className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-emerald-400" placeholder="Diskon, potongan, atau catatan pembelian" />
          </div>

          <button type="button" className="w-full rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400">
            Kirim laporan
          </button>
        </form>
      </div>
    </main>
  );
}
