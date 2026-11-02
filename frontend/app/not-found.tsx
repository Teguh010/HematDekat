/* eslint-disable i18next/no-literal-string */

import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";

export default async function NotFoundPage() {
  const t = await getTranslations("notFound");
  const commonT = await getTranslations("common");

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center">
        <p className="text-sm font-medium text-emerald-700">{commonT("appName")}</p>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("message")}</p>
        <Button href="/" className="mt-4">
          {t("backToHome")}
        </Button>
      </div>
    </div>
  );
}
