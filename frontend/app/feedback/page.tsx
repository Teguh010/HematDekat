import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";

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
    <PageContainer size="md">
      <PageHeader title={t("title")} />
      <Card className="space-y-3">
        <p className="text-sm leading-6 text-ink-700">{t("intro")}</p>

        <div className="rounded-lg border border-ink-200 bg-ink-50 p-3">
          <p className="text-xs font-medium text-ink-500">{t("emailLabel")}</p>
          <a
            href={`mailto:${email}`}
            className="mt-1 inline-block text-base font-semibold text-brand-700 hover:text-brand-800 focus-ring"
          >
            {email}
          </a>
        </div>

        <p className="text-sm leading-6 text-ink-700">{t("note")}</p>

        <div className="flex flex-wrap gap-2">
          <Button href={`mailto:${email}`}>{t("cta")}</Button>
          <Button href="/" variant="secondary">
            {t("backToHome")}
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
}
