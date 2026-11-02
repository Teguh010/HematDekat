import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata() {
  const t = await getTranslations("static.about");

  return {
    title: t("title"),
    description: t("description")
  };
}

export default async function Page() {
  const t = await getTranslations("static.about");

  return (
    <PageContainer size="md">
      <PageHeader title={t("title")} />
      <Card className="space-y-3">
        <p className="text-sm leading-6 text-ink-700">{t("intro")}</p>
        <p className="text-sm leading-6 text-ink-700">{t("section1")}</p>
        <p className="text-sm leading-6 text-ink-700">{t("section2")}</p>
        <p className="text-sm leading-6 text-ink-700">{t("section3")}</p>

        <Button href="/" variant="secondary">
          {t("backToHome")}
        </Button>
      </Card>
    </PageContainer>
  );
}
