import Link from "next/link";
import { useTranslations } from "next-intl";

export default function ReportPage() {
  const t = useTranslations("report");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-400">{t("title")}</p>
          <h1 className="mt-2 text-3xl font-bold text-white">{t("reportFormTitle")}</h1>
        </div>
        <Link href="/" className="rounded-full border border-white/10 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:border-emerald-400">
          {t("backToMap", { defaultValue: "Kembali ke peta" })}
        </Link>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900 p-6">
        <form className="space-y-5">
          <div>
            <label className="mb-2 block text-sm text-slate-300">{t("storeName")}</label>
            <input className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-emerald-400" placeholder={t("storeExample")} />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">{t("product")}</label>
            <input className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-emerald-400" placeholder={t("productExample")} />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-300">{t("price")}</label>
              <input className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-emerald-400" placeholder={t("priceExample")} />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">{t("unit")}</label>
              <select className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-emerald-400">
                {/* eslint-disable-next-line i18next/no-literal-string */}
                <option>kg</option>
                {/* eslint-disable-next-line i18next/no-literal-string */}
                <option>liter</option>
                {/* eslint-disable-next-line i18next/no-literal-string */}
                <option>pcs</option>
                {/* eslint-disable-next-line i18next/no-literal-string */}
                <option>pack</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">{t("promoNote")}</label>
            <textarea className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-emerald-400" placeholder={t("promoNoteExample")} />
          </div>

          <button type="button" className="w-full rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400">
            {t("submit")}
          </button>
        </form>
      </div>
    </main>
  );
}
