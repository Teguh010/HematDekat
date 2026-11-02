import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";

export async function generateMetadata() {
  const t = await getTranslations("static.terms");

  return {
    title: t("title"),
    description: t("description")
  };
}

export default async function Page() {
  const t = await getTranslations("static.terms");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-5 sm:px-6">
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <h1 className="text-xl font-semibold text-slate-900">{t("title")}</h1>
        <p className="text-sm leading-6 text-slate-700">{t("intro")}</p>
        <p className="text-sm leading-6 text-slate-700">{t("section1")}</p>
        <p className="text-sm leading-6 text-slate-700">{t("section2")}</p>
        <p className="text-sm leading-6 text-slate-700">{t("section3")}</p>
        <p className="text-sm leading-6 text-slate-700">{t("section4")}</p>

        <Button href="/" variant="secondary">
          {t("backToHome")}
        </Button>
      </div>
    </div>
  );
}
