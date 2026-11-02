/* eslint-disable i18next/no-literal-string */

import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function NotFoundPage() {
  const t = await getTranslations("notFound");
  const commonT = await getTranslations("common");

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <Card padding="lg" className="w-full max-w-md text-center">
        <p className="text-sm font-medium text-brand-700">{commonT("appName")}</p>
        <h1 className="mt-2 text-xl font-semibold text-ink-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-ink-500">{t("message")}</p>
        <Button href="/" className="mt-4">
          {t("backToHome")}
        </Button>
      </Card>
    </div>
  );
}
