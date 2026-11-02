import { getTranslations } from "next-intl/server";

export default async function Loading() {
  const t = await getTranslations("common");

  return (
    <div className="flex flex-1 items-center justify-center p-8 text-sm text-ink-500" role="status" aria-live="polite">
      {t("loading")}
    </div>
  );
}
