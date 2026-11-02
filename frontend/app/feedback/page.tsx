import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";

export async function generateMetadata() {
  const t = await getTranslations("static.feedback");

  return {
    title: t("title"),
    description: t("description")
  };
}

export default async function Page() {
  const t = await getTranslations("static.feedback");
  const email = t("email");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-5 sm:px-6">
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <h1 className="text-xl font-semibold text-slate-900">{t("title")}</h1>
        <p className="text-sm leading-6 text-slate-700">{t("intro")}</p>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-500">{t("emailLabel")}</p>
          <a
            href={`mailto:${email}`}
            className="mt-1 inline-block text-base font-semibold text-emerald-700 hover:text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            {email}
          </a>
        </div>

        <p className="text-sm leading-6 text-slate-700">{t("note")}</p>

        <div className="flex flex-wrap gap-2">
          <Button href={`mailto:${email}`}>{t("cta")}</Button>
          <Button href="/" variant="secondary">
            {t("backToHome")}
          </Button>
        </div>
      </div>
    </div>
  );
}
