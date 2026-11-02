/* eslint-disable i18next/no-literal-string */

import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("static.feedback");

  return {
    title: t("title"),
    description: t("description")
  };
}

export default async function Page() {
  const t = await getTranslations("static.feedback");
  const commonT = await getTranslations("common");
  const email = t("email");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-slate-950/30 sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">{commonT("appName")}</p>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{t("title")}</h1>
        <p className="text-base leading-7 text-slate-300">{t("intro")}</p>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">{t("emailLabel")}</p>
          <a href={`mailto:${email}`} className="mt-2 inline-block text-lg font-semibold text-emerald-300 transition hover:text-emerald-200">
            {email}
          </a>
        </div>

        <p className="text-base leading-7 text-slate-300">{t("note")}</p>

        <div className="flex flex-wrap gap-3 pt-2">
          <a
            href={`mailto:${email}`}
            className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400"
          >
            {t("cta")}
          </a>
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:border-emerald-400 hover:text-emerald-300"
          >
            {t("backToHome")}
          </Link>
        </div>
      </div>
    </main>
  );
}
