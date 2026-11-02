/* eslint-disable i18next/no-literal-string */

import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFoundPage() {
  const t = await getTranslations("notFound");
  const commonT = await getTranslations("common");

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/70 p-8 text-center shadow-xl shadow-slate-950/20">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">{commonT("appName")}</p>
        <h1 className="mt-4 text-3xl font-bold text-white">{t("title")}</h1>
        <p className="mt-3 text-base text-slate-300">{t("message")}</p>
        <Link href="/" className="mt-6 inline-flex items-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400">
          {t("backToHome")}
        </Link>
      </div>
    </main>
  );
}
